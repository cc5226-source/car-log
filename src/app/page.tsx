'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  // 컴포넌트 마운트 시 로컬 스토리지에서 마지막 사용자 불러오기
  useEffect(() => {
    const savedUser = localStorage.getItem('carLogSavedUser');
    if (savedUser) {
      setFormData(prev => ({ ...prev, user: savedUser }));
    }
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (!selectedDate) return;
    
    const dateObj = new Date(selectedDate);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[dateObj.getDay()] || '';

    const formattedDate = dateObj.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    }).replace('.', '월').replace('.', '일').trim();

    setFormData({
      ...formData,
      date: formattedDate,
      day: dayName,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 시간 포맷팅 함수 (예: 1300 -> 13:00, 930 -> 09:30)
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
      // 로컬 스토리지에 사용자 이름 저장
      localStorage.setItem('carLogSavedUser', formData.user);

      // 시간 자동 포맷팅 결합
      const formattedStartTime = formatTimeStr(formData.startTime);
      const formattedEndTime = formatTimeStr(formData.endTime);
      const combinedTime = `${formattedStartTime}~${formattedEndTime}`;

      // API 전송용 페이로드
      const payload = {
        date: formData.date,
        day: formData.day,
        user: formData.user,
        destination: formData.destination,
        purpose: formData.purpose,
        time: combinedTime, // 포맷팅된 시간 합치기
        endMileage: formData.endMileage,
      };

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('서버 전송 실패');
      }

      setSuccess(true);
      
      // 폼 초기화 (사용자 이름은 유지)
      setFormData(prev => ({
        ...prev,
        date: '',
        day: '',
        destination: '',
        purpose: '',
        startTime: '',
        endTime: '',
        endMileage: '',
      }));
      (e.target as HTMLFormElement).reset();
      
    } catch (err) {
      setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">공용차량 운행일지 입력</h1>
          <p className="text-sm text-gray-500 mt-1">스마트폰에서 간편하게 입력하세요.</p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용일자</label>
              <input
                type="date"
                required
                onChange={handleDateChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요일 (자동입력)</label>
              <input
                type="text"
                name="day"
                value={formData.day}
                readOnly
                className="w-full p-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자</label>
            <input
              type="text"
              name="user"
              value={formData.user}
              onChange={handleChange}
              required
              placeholder="예: 홍길동"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">행선지</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              placeholder="예: 서울시청"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">운행목적</label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              placeholder="예: 유관기관 업무협의"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <input
                type="text"
                inputMode="numeric"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                placeholder="예: 1300"
                maxLength={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <input
                type="text"
                inputMode="numeric"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                placeholder="예: 1530"
                maxLength={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">운행 후 키로수</label>
            <input
              type="number"
              name="endMileage"
              value={formData.endMileage}
              onChange={handleChange}
              required
              placeholder="운행 종료 후 총 키로수를 입력하세요"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-bold"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-md transition-all ${
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-95'
              }`}
            >
              {loading ? '전송 중...' : '운행일지 제출하기'}
            </button>
          </div>
          
        </form>
      </div>
    </main>
  );
}
