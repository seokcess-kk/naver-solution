import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Naver Place Monitor
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          네이버 플레이스 키워드 랭킹 추적, 리뷰 감정 분석, 경쟁사 비교까지
          <br />
          <span className="font-semibold text-blue-600">스마트한 네이버 플레이스 관리 솔루션</span>
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/register"
            className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            로그인
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📊 랭킹 트래킹
            </h3>
            <p className="text-gray-600">
              키워드별 네이버 플레이스 랭킹을 자동으로 추적하고 변화를 모니터링합니다
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💬 리뷰 분석
            </h3>
            <p className="text-gray-600">
              AI 감정 분석으로 긍정/부정 리뷰를 자동 분류하고 인사이트를 제공합니다
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🏆 경쟁사 비교
            </h3>
            <p className="text-gray-600">
              경쟁사의 랭킹, 리뷰 수, 평점을 비교 분석하여 전략을 수립합니다
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
