'use client';

import { useState, useEffect } from 'react';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type LogData = {
  rowIndex: number;
  date: string;
  day: string;
  user: string;
  destination: string;
  purpose: string;
  time: string;
  startMileage: string;
  endMileage: string;
  distance: string;
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/log');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (rowIndex: number) => {
    if (!confirm('정말 이 기록을 삭제하시겠습니까? (삭제하면 엑셀에서도 지워지며, 삭제된 줄 위로 데이터가 당겨집니다.)')) return;

    try {
      const res = await fetch(`/api/log?rowIndex=${rowIndex}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // 성공 시 로컬 상태 업데이트 (삭제된 항목 제외)
        setLogs(logs.filter(log => log.rowIndex !== rowIndex));
        alert('삭제되었습니다.');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 pb-20">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        
        <div className="flex items-center mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-800 p-2">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-2">운행 기록 수정/삭제</h1>
        </div>

        <p className="text-sm text-gray-500 mb-4">최근 기록부터 표시됩니다. 잘못 입력된 내역을 삭제하세요.</p>

        {loading ? (
          <div className="text-center py-10 text-gray-500">기록을 불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">운행 기록이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.rowIndex} className="border border-gray-200 rounded-lg p-4 relative bg-gray-50 hover:bg-gray-100 transition-colors">
                
                <button 
                  onClick={() => handleDelete(log.rowIndex)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2"
                  title="삭제하기"
                >
                  <Trash2 size={20} />
                </button>

                <div className="font-bold text-lg mb-1">{log.date} ({log.day})</div>
                <div className="text-sm text-gray-600 mb-2">운행시간: <span className="font-semibold text-gray-800">{log.time}</span></div>
                
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <div className="text-gray-500">사용자:</div>
                  <div className="font-medium">{log.user}</div>
                  
                  <div className="text-gray-500">행선지:</div>
                  <div className="font-medium">{log.destination}</div>
                  
                  <div className="text-gray-500">목적:</div>
                  <div className="font-medium truncate pr-8" title={log.purpose}>{log.purpose}</div>
                  
                  <div className="text-gray-500 mt-2">키로수:</div>
                  <div className="font-medium mt-2 text-blue-600">
                    {String(log.startMileage).replace(/km/i, '').trim()}km ➔ {String(log.endMileage).replace(/km/i, '').trim()}km ({String(log.distance).replace(/km/i, '').trim()}km)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
