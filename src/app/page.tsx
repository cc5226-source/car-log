'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Clock } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // 최근 기록 저장용
  const [lastLog, setLastLog] = useState<any>(null);

  const [formData, setFormData] = useState({
    date: '',
    day: '',
    user: '',
    destination: '',
    purpose: '',
    startTime: '',
    endTime: '',
    endMileage: '',
  });

  // 초기 설정 및 최근 기록 가져오기
  useEffect(() => {
    const savedUser = localStorage.getItem('carLogSavedUser');
    if (savedUser) {
      setFormData(prev => ({ ...prev, user: savedUser }));
    }
    
    // 오늘 날짜 기본 세팅
    const today = new Date();
    handleDateInput(today);

    // 최근 기록 패치
    fetch('/api/log')
      .then(res => res.json())
      .then(data => {
        if (data.logs && data.logs.length > 0) {
          setLastLog(data.logs[0]); // 가장 최신 기록
        }
      })
      .catch(console.error);
  }, []);

  const handleDateInput = (dateObj: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[dateObj.getDay()] || '';

    // "02월 03일" 형식
    const formattedDate = dateObj.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    }).replace('.', '월').replace('.', '일').trim();

    // input type="date" 에는 "yyyy-MM-dd" 형식의 문자열을 value 로 넣어줘야 표시가 됩니다.
    // 하지만 현재 요구사항은 "02월 03일" 포맷을 제출해야 하므로 date 필드를 나눴습니다.
    // 여기서는 제출용만 저장합니다.
    setFormData(prev => ({
      ...prev,
      date: formattedDate,
      day: dayName,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    handleDateInput(new Date(e.target.value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setCurrentTime = (field: 'startTime' | 'endTime') => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setFormData(prev => ({ ...prev, [field]: `${hours}${minutes}` }));
  };

  const formatTimeStr = (timeStr: string) => {
    const digits = timeStr.replace(/[^0-9]/g, '');
    if (digits.length === 3) {
      return `0${digits[0]}:${digits.slice(1)}`;
    } else if (digits.length === 4) {
      return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    return timeStr; 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      localStorage.setItem('carLogSavedUser', formData.user);

      const combinedTime = `${formatTimeStr(formData.startTime)}~${formatTimeStr(formData.endTime)}`;

      const payload = {
        date: formData.date,
        day: formData.day,
        user: formData.user,
        destination: formData.destination,
        purpose: formData.purpose,
        time: combinedTime,
        endMileage: formData.endMileage,
      };

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('서버 전송 실패');

      setSuccess(true);
      
      // 최신 로그 업데이트
      setLastLog({
         ...payload,
         startMileage: lastLog ? lastLog.endMileage : '0',
         distance: String(Number(payload.endMileage) - Number(lastLog ? lastLog.endMileage : 0))
      });

      setFormData(prev => ({
        ...prev,
        destination: '',
        purpose: '',
        startTime: '',
        endTime: '',
        endMileage: '',
      }));
      
    } catch (err) {
      setError('제출 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800 pb-20">
      
      {/* 데이터리스트 (자동완성 목록) */}
      <datalist id="user-list">
        <option value="이사장" />
        <option value="사무국장" />
        <option value="직원" />
      </datalist>
      <datalist id="dest-list">
        <option value="춘천시청" />
        <option value="차고지" />
        <option value="재단" />
      </datalist>
      <datalist id="purpose-list">
        <option value="업무수행" />
        <option value="유관기관 업무협의" />
        <option value="출퇴근 연계 운행" />
      </datalist>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">운행일지 작성</h1>
          <Link href="/history" className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            <History size={16} className="mr-1" />
            수정/삭제
          </Link>
        </div>

        {/* 최근 기록 요약 패널 */}
        {lastLog && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="text-xs font-semibold text-indigo-400 mb-1">최근 차량 상태</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm text-indigo-900">마지막 주차: <span className="font-bold">{lastLog.destination}</span></div>
                <div className="text-sm text-indigo-900">최종 키로수: <span className="font-bold">{lastLog.endMileage}km</span></div>
              </div>
              <div className="text-xs text-indigo-400">{lastLog.date} 기록됨</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">
            ✅ 성공적으로 기록되었습니다!
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용일자</label>
              <input
                type="date"
                required
                onChange={handleDateChange}
                // HTML 날짜 인풋은 기본적으로 yyyy-mm-dd를 요구하므로 value로 제어하지 않거나 직접 오늘을 넣어줘야함. 편의상 uncontrolled로 사용
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용자 (자동기억)</label>
              <input
                type="text"
                name="user"
                list="user-list"
                value={formData.user}
                onChange={handleChange}
                required
                placeholder="예: 홍길동"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">행선지</label>
            <input
              type="text"
              name="destination"
              list="dest-list"
              value={formData.destination}
              onChange={handleChange}
              required
              placeholder="예: 서울시청"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">운행목적</label>
            <input
              type="text"
              name="purpose"
              list="purpose-list"
              value={formData.purpose}
              onChange={handleChange}
              required
              placeholder="예: 유관기관 업무협의"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">시작 시간</label>
                <button type="button" onClick={() => setCurrentTime('startTime')} className="text-xs flex items-center text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                  <Clock size={12} className="mr-1"/> 지금
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                placeholder="예: 1300"
                maxLength={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
               <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">종료 시간</label>
                <button type="button" onClick={() => setCurrentTime('endTime')} className="text-xs flex items-center text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                  <Clock size={12} className="mr-1"/> 지금
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                placeholder="예: 1530"
                maxLength={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">운행 후 총 키로수 (계기판)</label>
            <input
              type="number"
              name="endMileage"
              value={formData.endMileage}
              onChange={handleChange}
              required
              placeholder="운행 종료 후 총 키로수를 입력하세요"
              className="w-full p-4 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xl font-bold text-indigo-900 bg-indigo-50/30"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
                loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {loading ? '서버에 기록하는 중...' : '운행일지 제출하기'}
            </button>
          </div>
          
        </form>
      </div>
    </main>
  );
}
