import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      day,
      user,
      destination,
      purpose,
      time,
      endMileage,
    } = body;

    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = process.env;
    
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
      console.error("Missing Google Sheets credentials");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 시트의 전체 행 수를 기반으로 셀 데이터를 불러옵니다. (안전하게 A8부터)
    const maxRows = sheet.rowCount;
    await sheet.loadCells(`A8:I${maxRows}`);

    let targetRowIndex = -1;
    let previousEndMileage = 0;

    // A열(사용일자)이 비어있는 첫 번째 행을 찾습니다.
    for (let r = 7; r < maxRows; r++) { // 0-indexed (7 = row 8)
      const dateCell = sheet.getCell(r, 0); // A열
      if (!dateCell.value) {
        targetRowIndex = r;
        
        // 이전 행이 존재한다면 (8행 초과), 이전 행의 주행후키로수(H열, index 7)를 가져옵니다.
        if (r > 7) {
          const prevEndMileageCell = sheet.getCell(r - 1, 7);
          previousEndMileage = Number(prevEndMileageCell.value) || 0;
        }
        break;
      }
    }

    if (targetRowIndex === -1) {
       return NextResponse.json({ error: 'Sheet is full' }, { status: 500 });
    }

    // 이번 운행의 주행전키로수 설정
    let startMileageForThisTrip = previousEndMileage;
    
    // 만약 완전히 첫 번째 기록(8행)이라면,
    if (targetRowIndex === 7) {
      const existingStartCell = sheet.getCell(7, 6); // G8 셀
      // G8 셀에 사용자가 미리 적어둔 값이 있다면 그것을 사용하고, 없다면 0으로 시작
      startMileageForThisTrip = Number(existingStartCell.value) || 0;
    }

    const currentEndMileage = Number(endMileage);
    const distance = currentEndMileage - startMileageForThisTrip;

    // 데이터 쓰기
    sheet.getCell(targetRowIndex, 0).value = date;
    sheet.getCell(targetRowIndex, 1).value = day;
    sheet.getCell(targetRowIndex, 2).value = user;
    sheet.getCell(targetRowIndex, 3).value = destination;
    sheet.getCell(targetRowIndex, 4).value = purpose;
    sheet.getCell(targetRowIndex, 5).value = time;
    sheet.getCell(targetRowIndex, 6).value = startMileageForThisTrip; // 계산된 주행전 키로수
    sheet.getCell(targetRowIndex, 7).value = currentEndMileage;       // 입력받은 주행후 키로수
    sheet.getCell(targetRowIndex, 8).value = distance;                // 계산된 주행거리

    // 한 번에 저장
    await sheet.saveUpdatedCells();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
