# ApplyFlow 개발일지

> **프로젝트:** ApplyFlow\
> **기록 정리일:** 2026-11-17\
> **개발 환경:** Windows PowerShell · `H:\applyflow`\
> **기술 스택:** Next.js 16.4.6(App Router), React, TypeScript,
> Supabase, Tailwind CSS v4, shadcn/ui, PostCSS, Vercel\
> **기록 범위:** 프로젝트 초기 구성부터 인증·기본 대시보드·CSS 빌드 문제
> 해결까지\
> **기록 기준:** 대화에서 공유한 코드, 터미널 로그, 화면 결과를 토대로
> 정리. 정확한 작업 날짜가 확인되지 않은 항목은 임의의 날짜를 부여하지
> 않음.

## 0. 오늘의 한 줄 요약

**ApplyFlow의 기본 인증 흐름과 대시보드까지 구현했고, Next.js 16의
렌더링 설정 및 Tailwind CSS v4/PostCSS 연결 과정에서 발생한 문제를
단계적으로 진단했다.**

### 현재 상태 요약

| 영역 | 상태 | 근거·비고 |
|---|---|---|
| Next.js | 완료 | App Router 실행 확인 |
| Supabase 연결 | 기본 구성 완료 | 공개 환경변수 사용 |
| 로그인 | 동작 확인 | 대시보드 진입 |
| 비밀번호 재설정 | 동작 확인 | 변경 성공 메시지 |
| 인증 보호 | 추가 검증 필요 | `auth.getUser()` 적용 |
| 대시보드 | 구현됨 | 이메일·로그아웃·현황 |
| `Date.now()` 오류 | 추가 검증 필요 | 최종 빌드 미확인 |
| Tailwind/PostCSS | 해결 보고됨 | 설정 파일 생성 후 작동 |
| MVP 핵심 기능 | 개발 예정 | 경험·지원서·일정 |
| Vercel 배포 | 재확인 필요 | 배포 성공 미확인 |

**추가 확인 사항:** 인증 보호에는 `/login` 리다이렉트가 포함되어 있으며, `Date.now()` 오류는 `cacheComponents` 관련 진단을 진행했으나 최종 빌드 통과가 확인되지 않았다. Tailwind/PostCSS는 `postcss.config.mjs` 생성 후 정상 작동했다고 보고되었다.


------------------------------------------------------------------------

## 1. 프로젝트 개요

### 만들고자 하는 서비스

ApplyFlow는 한국의 신입·주니어 구직자를 위한 취업 준비 관리 서비스다.

핵심 사용자 흐름:

1.  과거 활동과 성과를 **경험 보관함**에 정리한다.
2.  기업별 지원서와 자기소개서 문항을 작성한다.
3.  경험을 지원서 문항에 연결해 재활용한다.
4.  기업별 지원 상태와 마감일을 관리한다.
5.  대시보드에서 진행 상황을 확인한다.

### 초기 기술 선택

-   **Next.js / React / TypeScript:** 페이지와 사용자 인터페이스
-   **Supabase Auth:** 회원 인증 및 비밀번호 재설정
-   **Supabase Database:** 향후 사용자별 경험·지원서 데이터 저장
-   **Tailwind CSS / shadcn/ui:** 화면 스타일과 UI 컴포넌트
-   **Vercel:** 향후 배포 및 운영

**배운 점:** MVP에서는 모든 기능을 한꺼번에 구현하기보다, 인증 → 데이터
모델 → 핵심 CRUD → 통합 대시보드 순서가 적절하다.

------------------------------------------------------------------------

## 2. 작업 기록 01 --- 프로젝트 구조와 환경변수

### 작업 목표

Next.js 애플리케이션의 실제 라우트 위치를 확정하고 Supabase와 연결한다.

### 진행 내용

-   로컬 프로젝트 루트를 `H:\applyflow`로 사용했다.
-   Next.js App Router의 `app/` 구조를 확인했다.
-   `app/`와 `src/app/` 구조가 혼재하면서 페이지가 404로 보이던 문제를
    다뤘다.
-   Supabase 브라우저 클라이언트 import 경로 `@/lib/supabase/client`를
    정리했다.
-   `.env.local` 및 배포 환경에서 다음 공개 환경변수를 설정하는 방향으로
    작업했다.

``` env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

> 위 값은 **형식 예시**이며 실제 키를 기록하지 않았다.

### 발생한 문제

-   중복된 라우트 디렉터리 때문에 의도한 페이지가 나타나지 않았다.
-   import 경로와 실제 폴더 구조가 일치해야 했다.

### 조치 및 결과

-   현재 공유된 파일 구조에서는 `app/layout.tsx`, `app/app/layout.tsx`,
    `app/app/dashboard/page.tsx`가 사용된다.
-   Supabase 연결을 활용한 로그인과 대시보드 화면이 이후 정상 동작했다.

### 배운 점

-   App Router에서는 **어느 디렉터리가 실제 라우트 루트인지** 먼저
    확인해야 한다.
-   공개 환경변수와 비밀 키를 구분하고, 비밀 키를 클라이언트 코드에 넣지
    않아야 한다.

------------------------------------------------------------------------

## 3. 작업 기록 02 --- Supabase 인증과 비밀번호 재설정

### 작업 목표

로그인, 비밀번호 재설정 요청, 재설정 링크 처리, 새 비밀번호 저장,
재로그인까지 연결한다.

### 구현·확인한 파일

-   `app/forgot-password/page.tsx`
-   `app/auth/callback/route.ts`
-   `app/auth/reset-password/page.tsx`
-   `app/app/layout.tsx`
-   `lib/supabase/server.ts`

### 주요 구현 내용

비밀번호 재설정 메일 요청:

``` tsx
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
});
```

새 비밀번호 저장:

``` tsx
const { error } = await supabase.auth.updateUser({
  password,
});
```

비밀번호 변경 완료 후 로그아웃하고 새 비밀번호로 로그인하는 흐름을
사용했다.

### 발생한 문제

-   초기 재설정 링크에서 `otp_expired`, `One-time token not found`
    오류가 발생했다.
-   Supabase 기본 메일 전송에는 시간당 발송 제한이 있어 반복 테스트가
    제한될 수 있었다.
-   인증 콜백이 `next` 쿼리 파라미터를 일관되게 처리하는지 추가 점검이
    필요했다.

### 조치 및 결과

-   새로 발급받은 재설정 메일로 다시 시도했다.
-   **비밀번호 변경 성공 화면**을 확인했다.
-   변경한 비밀번호로 로그인하여 `/app/dashboard`에 진입했다.

### 남은 점검

-   [ ] 재설정 링크 만료·재사용·잘못된 토큰 처리 검증
-   [ ] `/auth/callback`의 `next` 파라미터 안전 처리
-   [ ] 일반 로그인 세션과 비밀번호 복구 전용 흐름 구분
-   [ ] 운영 환경의 메일 전송 정책 및 SMTP 검토

### 배운 점

-   비밀번호 재설정 링크는 유효기간과 일회성 특성을 고려해야 한다.
-   개발 중에는 인증 로그와 실제 화면 결과를 함께 확인하는 것이
    중요하다.

------------------------------------------------------------------------

## 4. 작업 기록 03 --- 인증 보호 레이아웃과 대시보드

### 작업 목표

로그인한 사용자만 `/app/dashboard`에 접근하도록 만들고, 기본 화면을
표시한다.

### 주요 코드

`app/app/layout.tsx`:

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

### 구현된 대시보드

`app/app/dashboard/page.tsx`에는 다음 요소가 포함되어 있었다.

-   `ApplyFlow 대시보드` 제목
-   로그인한 사용자 이메일을 활용한 환영 메시지
-   `LogoutButton`
-   `취업 준비 현황` 기본 카드

### 발견한 코드 문제

인증 레이아웃의 초기 코드에서는 `auth.getUser()` 결과에서 `error`만
추출하고, 선언하지 않은 `user` 변수를 사용했다.

``` tsx
const { error } = await supabase.auth.getUser();
if (error || !user) {
  redirect("/login");
}
```

이후 `data: { user }`를 함께 구조 분해하도록 수정했다.

### 확인 결과

-   로그인 후 기본 대시보드가 나타나는 것을 확인했다.
-   로그아웃 버튼이 화면에 표시됐다.
-   **비로그인 접근 차단과 로그아웃 후 재접근 차단은 별도 회귀 테스트가
    필요하다.**

### 배운 점

-   Supabase `auth.getUser()`는 `{ data: { user }, error }` 구조로
    결과를 반환한다.
-   서버에서 사용자 인증을 확인하는 보호 레이아웃은 UI뿐 아니라 접근
    통제에도 중요하다.

------------------------------------------------------------------------

## 5. 작업 기록 04 --- Next.js 16 `Date.now()` 사전 렌더링 오류

### 오류 메시지

``` text
Error: Route "/app/dashboard":
Next.js encountered the unstable value `Date.now()` while prerendering.

Call Stack: AppLayout
```

### 진단 과정

1.  애플리케이션 소스에서 다음 패턴을 검색했다.

``` powershell
Get-ChildItem app,lib,components -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern 'Date\.now\(|new Date\(|Math\.random\('
```

2.  **검색 결과가 없었다.** 따라서 직접 작성한 코드가 아닌 라이브러리
    내부 또는 렌더링 경로에서 시간 관련 코드가 실행될 가능성을 검토했다.
3.  `AppLayout`에서 `await connection()`을 추가했지만 오류가 계속됐다.
4.  인증 코드를 임시로 제외하는 진단을 진행했으나 같은 오류가 계속됐다.
5.  `.next` 캐시를 삭제하고 개발 서버를 재시작했으나 같은 오류가
    계속됐다고 보고했다.
6.  `cacheComponents: false`로 전환하는 진단을 시도했다.

### 추가로 발생한 설정 오류

``` text
Error: `partialPrefetching` requires `cacheComponents` to be enabled.
```

당시 설정은 다음과 같았다.

``` ts
cacheComponents: false,
partialPrefetching: true,
```

두 옵션 사이에 의존 관계가 있어 설정 자체가 유효하지 않았다.

### 조치 방향

진단을 단순화하기 위해 `next.config.ts`를 아래와 같이 최소 구성으로
변경하는 방안을 제시했다.

``` ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
};

export default nextConfig;
```

### 결과와 판단

-   이후 CSS 빌드 오류가 보고되었지만, **`Date.now()` 오류가 최종적으로
    완전히 해결됐는지는 별도로 확인되지 않았다.**
-   `AppLayout`에 표시된 스택만으로 내부 호출 위치를 확정할 수 없다.
-   인증을 제거한 진단용 코드는 배포 전에 반드시 복구해야 하며, 이후
    공유된 코드에서는 인증 검사 구문이 다시 포함되어 있었다.

### 배운 점

-   Next.js 16의 사전 렌더링은 현재 시간처럼 실행 시점마다 달라지는 값에
    민감할 수 있다.
-   `connection()`은 요청 시점 실행을 유도하지만 모든 오류를 자동으로
    해결하지는 않는다.
-   설정 옵션 간 의존성을 확인하고, 진단 결과와 해결 완료 여부를
    구분해서 기록해야 한다.

------------------------------------------------------------------------

## 6. 작업 기록 05 --- Supabase 서버 쿠키 처리 점검

### 확인한 코드

`lib/supabase/server.ts`에서 `createServerClient()`와 `cookies()`를
사용했다.

초기에 공유된 `setAll()`은 반복문 내부가 비어 있었다.

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

### 문제점

-   갱신된 쿠키를 실제로 저장하지 않아 세션 유지에 영향을 줄 수 있다.

### 수정 방향

``` tsx
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch {
    // Server Component에서는 쿠키 쓰기가 제한될 수 있음
  }
}
```

### 확인이 필요한 부분

-   [ ] 위 수정이 현재 파일에 반영되어 있는지 확인
-   [ ] `proxy.ts`에서 토큰 갱신과 쿠키 전달을 처리하는지 확인
-   [ ] 로그인 세션 만료·갱신 시나리오 테스트

### 배운 점

-   Supabase SSR 인증에서는 **쿠키 읽기와 쓰기**가 모두 중요하다.
-   Server Component에서 쿠키 쓰기가 제한되는 경우 별도의 Proxy 또는
    Route Handler 처리가 필요하다.

------------------------------------------------------------------------

## 7. 작업 기록 06 --- Tailwind CSS v4와 PostCSS 빌드 오류

### 발생한 오류

``` text
./app/globals.css:2:1
Module not found: Can't resolve 'tw-animate-css'
```

함께 보고된 경고:

``` text
Unknown at rule: @apply
Unknown at rule: @custom-variant
Unknown at rule: @theme
```

### 당시 `app/globals.css` 상단

``` css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

### 진단과 조치

1.  `tw-animate-css` 패키지 누락을 확인하고 설치를 안내했다.
2.  설치 후에도 Tailwind 문법 관련 오류가 남았다.
3.  `@tailwindcss/postcss` 설치 여부와 PostCSS 설정 파일 존재 여부를
    점검했다.
4.  프로젝트 루트에 **`postcss.config.mjs`를 직접 생성**했다.

``` js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 결과

사용자가 **`postcss.config.mjs`를 만들자 정상 작동한다**고 확인했다.

### 근본 원인 및 배운 점

-   `npm install`은 패키지를 설치하지만 필요한 설정 파일을 항상 자동
    생성하지는 않는다.
-   Tailwind CSS v4의 `@theme`, `@custom-variant`, `@apply` 등을
    처리하려면 적절한 변환 파이프라인이 필요하다.
-   문제 해결 시 **패키지 설치 여부 → 설정 파일 존재 → CSS import → 빌드
    결과** 순서로 확인하는 것이 효율적이다.

------------------------------------------------------------------------

## 8. 작업 기록 07 --- 개발 문서화

### 수행한 작업

-   ApplyFlow MVP의 상세 개발 작업계획서를 Markdown으로 작성했다.
-   동일한 계획서의 일본어판과 영어판도 작성했다.
-   계획서에는 Phase 0\~8, 데이터 모델 제안, RLS, 경험 보관함, 지원서,
    마감일, 대시보드, 테스트, 배포, 후속 확장 항목을 포함했다.

### 문서화 원칙

-   완료가 확인된 작업만 `[x]`로 표시한다.
-   구현되지 않았거나 확인되지 않은 기능은 `[ ]`로 남긴다.
-   오류가 발생한 이유, 시도한 수정, 최종 검증 여부를 구분한다.

### 배운 점

-   개발일지는 단순한 성공 기록보다 **시행착오와 판단 근거**를 남길 때
    재사용 가치가 높다.
-   여러 언어의 문서는 파일명과 목차 구조를 일관되게 유지하면 관리하기
    쉽다.

------------------------------------------------------------------------

## 9. 기술적 회고

### 잘된 점

-   비밀번호 재설정부터 새 비밀번호 로그인까지 사용자 흐름을 실제로
    확인했다.
-   로그를 바탕으로 문제를 인증, 렌더링, CSS 빌드로 나누어 진단했다.
-   PostCSS 설정 파일 누락을 찾아 스타일 빌드 문제를 해결했다.
-   MVP 기능을 단계별로 나누고 문서화했다.

### 어려웠던 점

-   App Router의 중복 디렉터리로 인한 라우팅 혼란
-   Supabase 인증 링크 만료와 메일 전송 제한
-   Next.js 16의 `Date.now()` 사전 렌더링 오류
-   `cacheComponents`와 `partialPrefetching`의 설정 의존성
-   패키지 설치와 PostCSS 설정 파일 생성의 차이

### 다음부터 개선할 점

-   한 번에 하나의 설정만 변경하고 결과를 기록한다.
-   진단용으로 인증을 제거했다면 즉시 복구한다.
-   오류가 사라진 경우에도 `npm run build`로 최종 검증한다.
-   환경 설정 파일과 `package-lock.json`을 함께 버전 관리한다.
-   구현 완료와 테스트 완료를 구분한다.

------------------------------------------------------------------------

## 10. 다음 작업 체크리스트

### 우선순위 P0 --- 기반 안정화

-   [ ] 현재 `next.config.ts`와 `postcss.config.mjs`를 최종 점검
-   [ ] `npx tsc --noEmit` 통과
-   [ ] `npm run build` 통과
-   [ ] `Date.now()` 오류 재발 여부 확인
-   [ ] 인증 레이아웃 및 비로그인 접근 차단 테스트
-   [ ] Supabase 서버 쿠키·`proxy.ts` 세션 갱신 점검
-   [ ] 비밀번호 재설정 콜백의 경로 처리 검증

### 우선순위 P0 --- MVP 기능 구현

-   [ ] Supabase `experiences` 테이블 설계
-   [ ] 사용자별 RLS 정책 작성
-   [ ] 경험 보관함 목록·등록·상세·수정·삭제
-   [ ] 지원서 및 문항별 답변 관리
-   [ ] 경험과 지원서 문항 연결
-   [ ] 채용 마감일 및 지원 상태 관리
-   [ ] 대시보드에 실제 데이터 연결
-   [ ] 보안·기능 테스트 및 배포 점검

### 다음 작업 전 실행할 명령어

``` powershell
cd H:\applyflow
npx tsc --noEmit
npm run build
git status
```

------------------------------------------------------------------------

## 11. 개발일지 추가 작성 템플릿

``` md
## YYYY-MM-DD — 작업 제목

### 오늘의 목표
- 

### 작업한 내용
- [ ] 

### 발생한 문제
- **증상:**
- **오류 메시지:**
- **원인 가설:**

### 해결 과정
1.
2.
3.

### 결과
- **확인 완료:**
- **추가 검증 필요:**

### 배운 점
-

### 다음 작업
- [ ]
```

**기록 결론:** ApplyFlow는 인증과 기본 화면을 갖춘 초기 MVP 기반 단계에
있다. Tailwind CSS/PostCSS 설정 문제는 해결되었다고 보고되었으며, 전체
빌드·세션 안정성·`Date.now()` 오류의 최종 검증과 핵심 업무 기능 구현이
다음 과제다.
