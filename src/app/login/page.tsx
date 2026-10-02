"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { loginSchema } from "@/lib/validation";
import { useApp } from "@/components/provider";
import { Button, FadeIn, Field, inputClass } from "@/components/ui";
export default function LoginPage() {
  const router = useRouter();
  const { login, busy } = useApp();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const parsed = loginSchema.safeParse({ email, name: signup ? name : "" });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await login(parsed.data.email, parsed.data.name);
      if (!result.ok) {
        setError(result.error ?? "Không lưu được phiên đăng nhập. Thử lại.");
        return;
      }
      router.replace("/");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#191719] px-5 py-10">
      <FadeIn>
        <div className="grid w-full max-w-[900px] overflow-hidden rounded-[28px] bg-[#fafaf9] shadow-2xl lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative hidden min-h-[600px] overflow-hidden bg-[#7557ff] p-10 text-white lg:block">
            <Link
              href="/"
              className="relative z-10 flex items-center gap-2 font-semibold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[#7557ff] text-sm font-bold">
                C
              </span>
              casematch
            </Link>
            <div className="relative z-10 mt-40 max-w-[260px]">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/60">
                Your next chapter
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[.98] tracking-[-.07em]">
                Good teams
                <br />
                make brave
                <br />
                ideas possible.
              </h1>
              <p className="mt-6 text-sm leading-6 text-white/70">
                Một workspace bình tĩnh để tìm đồng đội đúng với cách bạn muốn
                làm việc.
              </p>
            </div>
            <div className="noise absolute -bottom-24 -right-24 h-[390px] w-[390px] rounded-full border-[35px] border-white/15" />
            <div className="absolute -right-10 top-20 h-40 w-40 rotate-45 rounded-[30px] border border-white/20" />
          </div>
          <div className="p-7 sm:p-12">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold lg:hidden"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#7557ff] text-sm font-bold text-white">
                C
              </span>
              casematch
            </Link>
            <div className="mt-12 max-w-[360px] lg:mx-auto lg:mt-32">
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#7557ff]">
                CaseMatch workspace
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.06em]">
                {signup ? "Tạo tài khoản" : "Chào mừng trở lại"}
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Đăng nhập để tiếp tục hành trình tìm đội.
              </p>
              <form
                onSubmit={submit}
                className="mt-8 space-y-4"
                aria-busy={loading || busy}
              >
                {signup && (
                  <Field label="Tên của bạn">
                    <input
                      required={signup}
                      disabled={loading || busy}
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Linh Nguyen"
                      className={inputClass}
                    />
                  </Field>
                )}
                <Field label="Email">
                  <input
                    type="email"
                    required
                    disabled={loading || busy}
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </Field>
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-3 text-xs text-red-600"
                  >
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading || busy}>
                  {loading && (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  )}
                  {loading
                    ? "Đang đăng nhập..."
                    : signup
                      ? "Tạo tài khoản"
                      : "Đăng nhập"}
                </Button>
              </form>
              <button
                disabled={loading || busy}
                onClick={() => {
                  setSignup(!signup);
                  setError("");
                }}
                className="mt-6 w-full text-center text-xs text-stone-500 hover:text-[#7557ff]"
              >
                {signup
                  ? "Đã có tài khoản? Đăng nhập"
                  : "Chưa có tài khoản? Đăng ký"}
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    </main>
  );
}
