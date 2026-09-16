'use client';

import { useState } from 'react';

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
    time: '',
    startMileage: '',
    endMileage: '',
  });

  // 날짜 선택 시 요일 자동 계산
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const dateObj = new Date(selectedDate);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[dateObj.getDay()] || '';

    // "02월 03일" 형식으로 변환
    const formattedDate = dateObj.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    }).replace('.', '월').replace('.', '일').trim();

    setFormData({
      ...formData,
      date: formattedDate,
      day: dayName,
      // 내부적으로는 yyyy-mm-dd 도 저장할 수 있지만, 요구사항의 양식에 맞춤
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('서버 전송 실패');
      }

      setSuccess(true);
      // 폼 초기화
      setFormData({
        date: '',
        day: '',
        user: '',
        destination: '',
        purpose: '',
        time: '',
        startMileage: '',
        endMileage: '',
      });
      // 날짜 input 도 초기화해야 하므로 form 리셋
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">운행시간</label>
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              placeholder="예: 13:00~15:30"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주행 전 키로수</label>
              <input
                type="number"
                name="startMileage"
                value={formData.startMileage}
                onChange={handleChange}
                required
                placeholder="숫자만 입력"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주행 후 키로수</label>
              <input
                type="number"
                name="endMileage"
                value={formData.endMileage}
                onChange={handleChange}
                required
                placeholder="숫자만 입력"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
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
