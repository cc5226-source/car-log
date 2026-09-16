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

    // 환경 변수 검증
    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = process.env;
    
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
      console.error("Missing Google Sheets credentials");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // JWT 인증 설정
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // 환경 변수의 개행 문자 처리
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

    // 문서 정보 로드
    await doc.loadInfo();
    
    // 첫 번째 시트 선택
    const sheet = doc.sheetsByIndex[0];

    // 행 추가 (헤더 이름과 일치해야 함)
    // 시트의 첫 번째 줄(또는 헤더 줄)에 아래 항목들이 정확히 입력되어 있어야 합니다.
    await sheet.addRow([
      date,          // A열: 사용일자
      day,           // B열: 요일
      user,          // C열: 사용자
      destination,   // D열: 행선지
      purpose,       // E열: 운행목적
      time,          // F열: 운행시간
      startMileage,  // G열: 주행전 키로수
      endMileage,    // H열: 주행후 키로수
      ""             // I열: 확인 (빈칸)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
