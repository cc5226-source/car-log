import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 공통 인증 및 시트 로드 함수
async function getSheet() {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = process.env;
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    throw new Error("Missing Google Sheets credentials");
  }

  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc.sheetsByIndex[0];
}

// 전체 로그 조회 (최근 기록을 위해)
export async function GET() {
  try {
    const sheet = await getSheet();
    await sheet.loadHeaderRow(7); // 7행이 헤더 (사용일자, 요일 등)
    const rows = await sheet.getRows();
    
    // 데이터가 있는 행만 필터링 후 매핑
    const logs = rows
      .filter(r => r.get('사용일자'))
      .map(r => ({
        rowIndex: r.rowNumber,
        date: r.get('사용일자'),
        day: r.get('요일'),
        user: r.get('사용자'),
        destination: r.get('행선지'),
        purpose: r.get('운행목적'),
        time: r.get('운행시간'),
        startMileage: r.get('주행전키로수'),
        endMileage: r.get('주행후키로수'),
        distance: r.get('주행거리')
      }));
      
    // 최신 기록이 위로 오게 뒤집기
    return NextResponse.json({ logs: logs.reverse() });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// 새로운 로그 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, day, user, destination, purpose, time, endMileage } = body;
    const sheet = await getSheet();

    const maxRows = sheet.rowCount;
    await sheet.loadCells(`B8:K${maxRows}`);

    let targetRowIndex = -1;
    let previousEndMileage = 0;

    for (let r = 7; r < maxRows; r++) { 
      const dateCell = sheet.getCell(r, 1); 
      if (!dateCell.value) {
        targetRowIndex = r;
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

    let startMileageForThisTrip = previousEndMileage;
    if (targetRowIndex === 7) {
      const existingStartCell = sheet.getCell(7, 7); 
      startMileageForThisTrip = Number(existingStartCell.value) || 0;
    }

    const currentEndMileage = Number(endMileage);
    const distance = currentEndMileage - startMileageForThisTrip;

    sheet.getCell(targetRowIndex, 1).value = date;             
    sheet.getCell(targetRowIndex, 2).value = day;              
    sheet.getCell(targetRowIndex, 3).value = user;             
    sheet.getCell(targetRowIndex, 4).value = destination;      
    sheet.getCell(targetRowIndex, 5).value = purpose;          
    sheet.getCell(targetRowIndex, 6).value = time;             
    sheet.getCell(targetRowIndex, 7).value = startMileageForThisTrip; 
    sheet.getCell(targetRowIndex, 8).value = currentEndMileage;       
    sheet.getCell(targetRowIndex, 9).value = distance;                

    await sheet.saveUpdatedCells();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

// 로그 삭제 (해당 행 완전 삭제 및 위로 당기기)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = parseInt(searchParams.get('rowIndex') || '0');
    
    if (rowIndex < 8) return NextResponse.json({ error: 'Invalid row' }, { status: 400 });

    const sheet = await getSheet();
    await sheet.loadHeaderRow(7);
    const rows = await sheet.getRows();
    
    // 삭제할 행 객체 찾기
    const rowToDelete = rows.find(r => r.rowNumber === rowIndex);
    
    if (rowToDelete) {
      await rowToDelete.delete();
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete row' }, { status: 500 });
  }
}
