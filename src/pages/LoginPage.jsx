import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import fscapeLogo from "../assets/fscape-logo.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@fscape.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-muted/30 px-8 py-12 lg:px-16"
      style={{
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 93%) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 sm:p-10">
          {/* Logo + Admin branding */}
          <div className="mb-8 flex items-center gap-3">
            <img src={fscapeLogo} alt="FScape" className="size-12 rounded-xl" />
            <span className="text-xl font-semibold text-foreground">Hệ thống quản lý</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gặp sự cố khi đăng nhập?{" "}
            <a
              href="mailto:support@fscape.com"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Liên hệ.
            </a>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Địa chỉ email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Sử dụng email công ty"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <Button type="submit">Đăng nhập</Button>
              <button
                type="reset"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setEmail("");
                  setPassword("");
                  setError("");
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
