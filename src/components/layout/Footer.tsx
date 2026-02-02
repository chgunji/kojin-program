import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-bold text-green-400">
              個サル予約
            </Link>
            <p className="mt-4 text-gray-400">
              個人フットサル・個人ソサイチの検索・予約サービス。
              全国の施設で開催されるプログラムに気軽に参加できます。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/programs" className="text-gray-400 hover:text-white transition-colors">
                  プログラム検索
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                  ログイン
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-white transition-colors">
                  新規登録
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">その他</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 個サル予約. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
