"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/components/provider/authProvider";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useRouter } from "next/navigation";
import { toast } from "@workspace/ui/components/sonner";
import Link from "next/link";

type FormValues = {
  identifier: string; // 用户名或邮箱
  password: string;
};

export function LoginForm() {
  const [loginType, setLoginType] = useState<"username" | "email">("username");
  const router = useRouter();
  const { login } = useAuth();

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    } as FormValues,
    onSubmit: async ({ value }) => {
      if (!value.identifier || !value.password) {
        toast.error("请输入用户名/邮箱和密码");
        return;
      }

      try {
        const loginData =
          loginType === "username"
            ? { username: value.identifier, password: value.password }
            : { email: value.identifier, password: value.password };

        await login(loginData);
        toast.success("登录成功");
        router.push("/explore");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "登录失败";
        toast.error(errorMessage);
      }
    },
  });

  return (
    <div className="bg-card w-[350px] rounded-lg border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">登录</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          使用用户名或邮箱登录
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={loginType === "username" ? "default" : "outline"}
              onClick={() => setLoginType("username")}
              className="flex-1"
            >
              用户名
            </Button>
            <Button
              type="button"
              variant={loginType === "email" ? "default" : "outline"}
              onClick={() => setLoginType("email")}
              className="flex-1"
            >
              邮箱
            </Button>
          </div>

          <form.Field name="identifier">
            {(field) => {
              return (
                <Field>
                  <FieldLabel>
                    {loginType === "username" ? "用户名" : "邮箱"}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type={loginType === "email" ? "email" : "text"}
                      placeholder={
                        loginType === "username" ? "请输入用户名" : "请输入邮箱"
                      }
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      disabled={form.state.isSubmitting}
                    />
                  </FieldContent>
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              return (
                <Field>
                  <FieldLabel>密码</FieldLabel>
                  <FieldContent>
                    <Input
                      type="password"
                      placeholder="请输入密码"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      disabled={form.state.isSubmitting}
                    />
                  </FieldContent>
                </Field>
              );
            }}
          </form.Field>

          <Button
            type="submit"
            className="w-full"
            disabled={form.state.isSubmitting}
          >
            {form.state.isSubmitting ? "登录中..." : "登录"}
          </Button>

          <div className="text-muted-foreground mt-4 text-center text-sm">
            还没有账户？{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              立即注册
            </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
