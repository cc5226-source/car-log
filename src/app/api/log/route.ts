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

    // 시트의 전체 행 수를 기반으로 셀 데이터를 불러옵니다. (B8부터 K열까지)
    const maxRows = sheet.rowCount;
    await sheet.loadCells(`B8:K${maxRows}`);

    let targetRowIndex = -1;
    let previousEndMileage = 0;

    // B열(사용일자, index 1)이 비어있는 첫 번째 행을 찾습니다.
    for (let r = 7; r < maxRows; r++) { // 0-indexed (7 = row 8)
      const dateCell = sheet.getCell(r, 1); // B열
      if (!dateCell.value) {
        targetRowIndex = r;
        
        // 이전 행이 존재한다면 (8행 초과), 이전 행의 주행후키로수(I열, index 8)를 가져옵니다.
        if (r > 7) {
          const prevEndMileageCell = sheet.getCell(r - 1, 8);
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
      const existingStartCell = sheet.getCell(7, 7); // H8 셀 (주행전키로수)
      // H8 셀에 사용자가 미리 적어둔 값이 있다면 그것을 사용하고, 없다면 0으로 시작
      startMileageForThisTrip = Number(existingStartCell.value) || 0;
    }

    const currentEndMileage = Number(endMileage);
    const distance = currentEndMileage - startMileageForThisTrip;

    // 데이터 쓰기 (index가 하나씩 밀렸으므로 +1)
    sheet.getCell(targetRowIndex, 1).value = date;             // B열: 사용일자
    sheet.getCell(targetRowIndex, 2).value = day;              // C열: 요일
    sheet.getCell(targetRowIndex, 3).value = user;             // D열: 사용자
    sheet.getCell(targetRowIndex, 4).value = destination;      // E열: 행선지
    sheet.getCell(targetRowIndex, 5).value = purpose;          // F열: 운행목적
    sheet.getCell(targetRowIndex, 6).value = time;             // G열: 운행시간
    sheet.getCell(targetRowIndex, 7).value = startMileageForThisTrip; // H열: 주행전키로수
    sheet.getCell(targetRowIndex, 8).value = currentEndMileage;       // I열: 주행후키로수
    sheet.getCell(targetRowIndex, 9).value = distance;                // J열: 주행거리

    // 한 번에 저장
    await sheet.saveUpdatedCells();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
