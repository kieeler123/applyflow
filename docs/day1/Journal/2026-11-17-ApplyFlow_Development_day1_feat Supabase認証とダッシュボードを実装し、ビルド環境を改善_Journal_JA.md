# ApplyFlow 開発日誌

> **プロジェクト:** ApplyFlow\
> **記録整理日:** 2026-11-17\
> **開発環境:** Windows PowerShell · `H:\applyflow`\
> **技術スタック:** Next.js 16.4.6（App
> Router）、React、TypeScript、Supabase、Tailwind CSS
> v4、shadcn/ui、PostCSS、Vercel\
> **対象範囲:**
> 初期セットアップから認証・基本ダッシュボード・CSSビルド問題の解決まで\
> **記録方針:**
> 会話で共有されたコード、ターミナルログ、画面結果に基づく。実施日が特定できない作業には架空の日付を付けない。

## 0. 開発の概要

**ApplyFlowの基本的な認証フローとダッシュボードを実装し、Next.js
16のレンダリング設定とTailwind CSS
v4／PostCSS連携で生じた問題を段階的に調査した。**

### 現在の状況

| 領域 | 状況 | 根拠・備考 |
|---|---|---|
| Next.js | 完了 | App Router動作確認 |
| Supabase接続 | 基本設定完了 | 公開環境変数を使用 |
| ログイン | 動作確認済み | ダッシュボードへ移動 |
| パスワード再設定 | 動作確認済み | 変更成功画面を確認 |
| 認証付きレイアウト | 要追加検証 | `auth.getUser()` 使用 |
| ダッシュボード | 実装済み | メール・ログアウト・進捗 |
| `Date.now()` エラー | 要追加検証 | 最終ビルド未確認 |
| Tailwind/PostCSS | 解決報告あり | 設定ファイル作成後に動作 |
| MVP主要機能 | 開発予定 | 経験・応募書類・締切 |
| Vercelデプロイ | 要再確認 | 成功は未確認 |

**追加の確認事項:** 認証付きレイアウトには `/login` へのリダイレクトがある。`Date.now()` エラーでは `cacheComponents` を調査したが、最終ビルド成功は未確認。Tailwind/PostCSSは `postcss.config.mjs` の作成後に正常動作したとの報告があった。


------------------------------------------------------------------------

## 1. プロジェクトの目的

ApplyFlowは韓国の新卒・若手求職者向けの就職活動管理サービス。

主な利用フロー：

1.  過去の活動や成果を**経験ストック**に整理する。
2.  企業別の応募書類・自己紹介書の設問に回答する。
3.  保存した経験を設問に紐付けて再利用する。
4.  応募ステータスと締切を管理する。
5.  ダッシュボードで進捗を確認する。

### 技術選定

-   **Next.js／React／TypeScript:** ページとUI
-   **Supabase Auth:** 認証とパスワード再設定
-   **Supabase Database:** 今後のユーザー別データ保存
-   **Tailwind CSS／shadcn/ui:** スタイルとUIコンポーネント
-   **Vercel:** デプロイ・運用

**学び:** MVPは認証 → データモデル → CRUD →
ダッシュボード統合の順に構築する方が管理しやすい。

------------------------------------------------------------------------

## 2. 開発記録 01 --- プロジェクト構成と環境変数

### 目標

Next.jsのルート構成を確定し、Supabaseへ接続する。

### 実施内容

-   ローカルのプロジェクトルートを `H:\applyflow` に設定。
-   App Routerの `app/` 構成を確認。
-   `app/` と `src/app/` が混在し、ページが404になる問題を調査。
-   `@/lib/supabase/client` のimportパスを整理。
-   `.env.local`
    およびデプロイ環境で以下の公開環境変数を扱うように構成。

``` env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

> 上記は**書式例**であり、実際のキーは記録していない。

### 問題と対応

-   ルートディレクトリが重複すると、意図したページが表示されなかった。
-   importパスと実際のフォルダ構成の整合性が必要だった。
-   共有された最終的な構成では
    `app/layout.tsx`、`app/app/layout.tsx`、`app/app/dashboard/page.tsx`
    を使用していた。

### 学び

App
Routerでは実際のルートディレクトリを先に確定し、公開環境変数と秘密鍵を明確に区別する。

------------------------------------------------------------------------

## 3. 開発記録 02 --- Supabase認証とパスワード再設定

### 目標

ログインからパスワード再設定メール、リンク処理、新しいパスワードの保存、再ログインまでつなぐ。

### 主なファイル

-   `app/forgot-password/page.tsx`
-   `app/auth/callback/route.ts`
-   `app/auth/reset-password/page.tsx`
-   `app/app/layout.tsx`
-   `lib/supabase/server.ts`

### 実装例

パスワード再設定メールの送信：

``` tsx
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
});
```

新しいパスワードの保存：

``` tsx
const { error } = await supabase.auth.updateUser({
  password,
});
```

変更後はログアウトし、新しいパスワードでログインする流れを採用した。

### 発生した問題

-   初期のリンクで `otp_expired` と `One-time token not found` が発生。
-   Supabase標準メール送信のレート制限により、繰り返しのテストに制約があった。
-   コールバックで `next`
    パラメータを正しく処理しているか、追加検証が必要だった。

### 結果

-   新しく発行されたメールリンクで再試行。
-   **パスワード変更成功画面**を確認。
-   新しいパスワードでログインし、`/app/dashboard` への遷移を確認。

### 残タスク

-   [ ] 期限切れ・再利用・無効なトークンの処理をテスト
-   [ ] `/auth/callback` の `next` パラメータを安全に処理
-   [ ] 通常ログインとパスワード復旧フローを区別
-   [ ] 本番環境のSMTPとメール送信制限を検討

### 学び

認証リンクには有効期限や再利用制限がある。ログと画面上の結果を合わせて確認する必要がある。

------------------------------------------------------------------------

## 4. 開発記録 03 --- 認証付きレイアウトとダッシュボード

### 目標

ログイン済みユーザーだけが `/app/dashboard` にアクセスできるようにする。

### 主なコード

`app/app/layout.tsx`：

``` tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

### ダッシュボードの内容

-   `ApplyFlow 대시보드` の見出し
-   ログインユーザーのメールアドレスを使った歓迎メッセージ
-   `LogoutButton`
-   `취업 준비 현황` の基本カード

### 発見した問題

初期の認証レイアウトでは `error` だけを取り出し、未定義の `user`
を参照していた。

``` tsx
const { error } = await supabase.auth.getUser();
if (error || !user) {
  redirect("/login");
}
```

その後 `data: { user }` も取得するように修正した。

### 結果と学び

-   ログイン後のダッシュボード表示を確認。
-   ログアウトボタンの表示を確認。
-   **未ログインアクセスの遮断とログアウト後の再アクセス防止は回帰テストが必要。**
-   `auth.getUser()` の返り値の構造を正しく扱うことが重要。

------------------------------------------------------------------------

## 5. 開発記録 04 --- Next.js 16の `Date.now()` エラー

### エラー

``` text
Error: Route "/app/dashboard":
Next.js encountered the unstable value `Date.now()` while prerendering.

Call Stack: AppLayout
```

### 調査手順

1.  アプリケーションのソースで時間・乱数関連の処理を検索。

``` powershell
Get-ChildItem app,lib,components -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern 'Date\.now\(|new Date\(|Math\.random\('
```

2.  **該当する直接使用は見つからなかった。**
    ライブラリ内部やレンダリング経路での実行を疑った。
3.  `AppLayout` に `await connection()` を追加したが、エラーは継続。
4.  認証処理を一時的に外しても同じエラーが継続。
5.  `.next`
    を削除して開発サーバーを再起動したが、エラーは継続したと報告。
6.  `cacheComponents: false` を試した。

### 追加の設定エラー

``` text
Error: `partialPrefetching` requires `cacheComponents` to be enabled.
```

当時の設定：

``` ts
cacheComponents: false,
partialPrefetching: true,
```

両設定には依存関係があり、この組み合わせは無効だった。

### 対応案

診断を簡単にするため、`next.config.ts` を最小構成にする案を提示。

``` ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
};

export default nextConfig;
```

### 結果と学び

-   その後CSSビルドエラーが報告されたが、**`Date.now()`
    エラーの最終的な解消と本番ビルド成功は未確認。**
-   スタックに `AppLayout`
    が表示されても、内部呼び出しの正確な位置までは確定できない。
-   診断用に認証を外した場合は必ず元に戻す。後に共有されたコードには認証チェックが再び含まれていた。
-   `connection()`
    はリクエスト時の実行に役立つが、すべての問題を自動的に解決するわけではない。

------------------------------------------------------------------------

## 6. 開発記録 05 --- SupabaseサーバーCookie処理

### 確認したコード

`lib/supabase/server.ts` で `createServerClient()` と `cookies()`
を使用。

当初の `setAll()` ではループ内の処理が空だった。

``` tsx
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
    });
  } catch {
    // ...
  }
}
```

### 問題

更新されたCookieが実際に保存されず、セッション維持に影響する可能性があった。

### 修正方針

``` tsx
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch {
    // Server ComponentではCookieの書き込みが制限される場合がある
  }
}
```

### 今後の確認

-   [ ] 修正が現在のファイルに反映されているか確認
-   [ ] `proxy.ts` によるトークン更新とCookieの受け渡しを確認
-   [ ] セッション期限切れ・更新のテスト

### 学び

Supabase SSR認証ではCookieの読み取りと書き込みの両方が重要。Server
Componentの制限を踏まえ、ProxyやRoute Handlerを適切に使う。

------------------------------------------------------------------------

## 7. 開発記録 06 --- Tailwind CSS v4とPostCSS

### エラー

``` text
./app/globals.css:2:1
Module not found: Can't resolve 'tw-animate-css'
```

関連警告：

``` text
Unknown at rule: @apply
Unknown at rule: @custom-variant
Unknown at rule: @theme
```

### 当時のCSS

``` css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

### 対応の流れ

1.  `tw-animate-css` の不足を確認し、インストールを案内。
2.  インストール後もTailwind構文に関するエラーが残った。
3.  `@tailwindcss/postcss` とPostCSS設定ファイルの有無を確認。
4.  プロジェクトルートに **`postcss.config.mjs` を手動で作成**。

``` js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 結果

ユーザーから **`postcss.config.mjs` を作成すると正常に動作した**
と報告があった。

### 根本原因と学び

-   `npm install`
    はパッケージをインストールするが、設定ファイルを常に自動生成するわけではない。
-   Tailwind CSS
    v4の特殊構文を処理するには、適切なPostCSSプラグイン設定が必要。
-   パッケージ → 設定ファイル → CSS import →
    ビルド結果の順に確認すると効率的。

------------------------------------------------------------------------

## 8. 開発記録 07 --- ドキュメント整備

### 実施内容

-   ApplyFlow MVPの詳細開発計画書をMarkdownで作成。
-   同じ計画書の日本語版と英語版を作成。
-   Phase
    0～8、DB設計案、RLS、経験ストック、応募書類、締切、ダッシュボード、テスト、デプロイ、将来の拡張を整理。

### 記録方針

-   完了が確認された項目のみ `[x]`。
-   未実装・未確認の項目は `[ ]`。
-   問題、対応、結果、未検証事項を分けて記録。

### 学び

開発日誌には成功だけでなく、試行錯誤と判断根拠を残す価値がある。

------------------------------------------------------------------------

## 9. 振り返り

### うまくいった点

-   パスワード再設定から新しいパスワードでのログインまで実際に確認できた。
-   認証・レンダリング・CSSビルドを切り分けて調査した。
-   PostCSS設定ファイルの不足を特定し、スタイルの問題を解決した。
-   MVPの開発工程を段階的に文書化した。

### 苦労した点

-   `app/` と `src/app/` の重複によるルーティングの混乱
-   Supabaseのリンク期限切れとメール送信制限
-   Next.js 16の `Date.now()` プリレンダリングエラー
-   `cacheComponents` と `partialPrefetching` の依存関係
-   パッケージのインストールと設定ファイルの作成が別作業であること

### 次回の改善

-   一度に変更する設定は一つに絞り、結果を記録する。
-   認証を外した診断コードはすぐに元へ戻す。
-   エラー解消後も `npm run build` で最終確認する。
-   設定ファイルと `package-lock.json` をバージョン管理する。
-   実装完了とテスト完了を分けて管理する。

------------------------------------------------------------------------

## 10. 次の作業

### P0 --- 基盤の安定化

-   [ ] `next.config.ts` と `postcss.config.mjs` の最終確認
-   [ ] `npx tsc --noEmit` 成功
-   [ ] `npm run build` 成功
-   [ ] `Date.now()` エラーの再発確認
-   [ ] 認証レイアウトと未ログインアクセス遮断のテスト
-   [ ] SupabaseのCookie処理と `proxy.ts` を点検
-   [ ] パスワード再設定コールバックの遷移先を検証

### P0 --- MVP機能

-   [ ] Supabase `experiences` テーブル設計
-   [ ] ユーザー単位のRLSポリシー作成
-   [ ] 経験ストックの一覧・作成・詳細・編集・削除
-   [ ] 応募書類と設問ごとの回答管理
-   [ ] 経験と応募設問の紐付け
-   [ ] 締切と応募ステータス管理
-   [ ] ダッシュボードへの実データ連携
-   [ ] セキュリティ・機能テストとデプロイ確認

### 次の作業前に実行

``` powershell
cd H:\applyflow
npx tsc --noEmit
npm run build
git status
```

------------------------------------------------------------------------

## 11. 今後の開発日誌テンプレート

``` md
## YYYY-MM-DD — 作業タイトル

### 今日の目標
-

### 実施した作業
- [ ]

### 発生した問題
- **症状:**
- **エラーメッセージ:**
- **原因の仮説:**

### 対応手順
1.
2.
3.

### 結果
- **確認済み:**
- **追加検証が必要:**

### 学んだこと
-

### 次の作業
- [ ]
```

**まとめ:** ApplyFlowは認証と基本画面を備えた初期MVP段階にある。Tailwind
CSS／PostCSSの問題は解決したとの報告があり、次はビルド、セッション、`Date.now()`
エラーの最終確認と主要業務機能の実装に取り組む。
