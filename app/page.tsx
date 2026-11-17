import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "100px auto",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>ApplyFlow</h1>

      <p style={{ fontSize: 20, color: "#666" }}>
        취업 준비의 모든 과정을 한곳에서 관리하세요.
      </p>

      <p style={{ marginTop: 16 }}>
        경험 정리부터 자기소개서 작성, 지원 일정 관리까지.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginTop: 40,
        }}
      >
        <Link href="/signup">무료로 시작하기</Link>
        <Link href="/login">로그인</Link>
      </div>
    </main>
  );
}
