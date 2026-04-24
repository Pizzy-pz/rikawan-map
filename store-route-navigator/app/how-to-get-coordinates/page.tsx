import Link from "next/link";
import Image from "next/image";

export default function HowToGetCoordinatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 戻るボタン */}
        <Link
          href="/stores/new"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">フォームに戻る</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">座標の取得方法</h1>
        <p className="text-sm text-gray-500 mb-8">
          Google マップで場所を長押しすると、正確な座標（緯度・経度）をコピーできます。
        </p>

        {/* iOS セクション */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🍎</span>
            <h2 className="text-lg font-bold text-gray-800">iPhone の場合</h2>
          </div>

          <ol className="space-y-4 mb-6">
            {[
              "Google マップアプリを開く",
              "目的の場所を長押し（ラベルのない場所を長押しすると赤いピンが立つ）",
              "画面下部に表示されるパネルを少し上にスワイプする",
              "住所の下に「35.xxxx, 139.xxxx」のような数字が表示される",
              "その数字をタップしてコピーする",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{text}</p>
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <Image
                src="/座標取得方法1.png"
                alt="iPhoneでの座標取得手順1：場所を長押し"
                width={400}
                height={700}
                className="w-full h-auto"
              />
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <Image
                src="/座標取得方法2b.png"
                alt="iPhoneでの座標取得手順2：数字をタップしてコピー"
                width={400}
                height={700}
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Android セクション */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-bold text-gray-800">Android の場合</h2>
          </div>

          <ol className="space-y-4 mb-6">
            {[
              "Google マップアプリを開く",
              "目的の場所を長押し（ラベルのない場所を長押しすると赤いピンが立つ）",
              "画面上部の検索ボックス、または画面下部のパネルに「35.xxxx, 135.xxxx」のような数字が表示されるので、長押ししてコピーする",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{text}</p>
              </li>
            ))}
          </ol>

          <div className="max-w-[280px]">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <Image
                src="/画像説明_android.jpg"
                alt="Androidでの座標取得手順"
                width={400}
                height={700}
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* コピーした座標の貼り付け方 */}
        <section className="bg-blue-50 rounded-2xl border border-blue-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📋</span>
            <h2 className="text-base font-bold text-blue-800">コピーした座標を貼り付ける</h2>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">
            フォームに戻り、「座標」欄にコピーした数字をそのままペーストしてください。
            <br />
            <span className="font-mono bg-blue-100 px-1 rounded">35.0053, 135.7731</span> のような形式であればそのまま使えます。
          </p>
        </section>

        <div className="text-center">
          <Link
            href="/stores/new"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            フォームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
