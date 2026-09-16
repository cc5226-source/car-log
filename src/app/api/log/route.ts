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
      startMileage,
      endMileage,
    } = body;

    // 주행거리 자동 계산
    const distance = Number(endMileage) - Number(startMileage);

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

    // 헤더가 7행에 있으므로 데이터를 배열 형태로 바로 밀어넣습니다.
    // 주의: 시트의 J열(확인란)에 미리 체크박스가 빈칸까지 쫙 깔려있으면 그 아래(27행 등)부터 입력될 수 있습니다.
    // 빈 셀에는 체크박스를 지워두시는 것이 좋습니다. (전체 열에 데이터 확인 규칙만 걸어두면 됩니다)
    await sheet.addRow([
      date,          // A열: 사용일자
      day,           // B열: 요일
      user,          // C열: 사용자
      destination,   // D열: 행선지
      purpose,       // E열: 운행목적
      time,          // F열: 운행시간
      startMileage,  // G열: 주행전키로수
      endMileage,    // H열: 주행후키로수
      distance,      // I열: 주행거리 (자동계산)
      ""             // J열: 확인 (빈칸)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
