"use client";

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
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as FormValues,
    onSubmit: async ({ value }) => {
      if (!value.username || !value.email || !value.password) {
        toast.error("请填写所有必填字段");
        return;
      }

      if (value.password.length < 6) {
        toast.error("密码长度至少为 6 位");
        return;
      }

      if (value.password !== value.confirmPassword) {
        toast.error("两次输入的密码不一致");
        return;
      }

      try {
        await register({
          username: value.username,
          email: value.email,
          password: value.password,
        });
        toast.success("注册成功");
        router.push("/explore");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "注册失败";
        toast.error(errorMessage);
      }
    },
  });

  return (
    <div className="bg-card w-[350px] rounded-lg border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">注册</h2>
        <p className="text-muted-foreground mt-1 text-sm">创建新账户</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="username">
            {(field) => {
              return (
                <Field>
                  <FieldLabel>用户名</FieldLabel>
                  <FieldContent>
                    <Input
                      type="text"
                      placeholder="请输入用户名"
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

          <form.Field name="email">
            {(field) => {
              return (
                <Field>
                  <FieldLabel>邮箱</FieldLabel>
                  <FieldContent>
                    <Input
                      type="email"
                      placeholder="请输入邮箱"
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
                      placeholder="请输入密码（至少 6 位）"
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

          <form.Field name="confirmPassword">
            {(field) => {
              return (
                <Field>
                  <FieldLabel>确认密码</FieldLabel>
                  <FieldContent>
                    <Input
                      type="password"
                      placeholder="请再次输入密码"
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
            {form.state.isSubmitting ? "注册中..." : "注册"}
          </Button>

          <div className="text-muted-foreground mt-4 text-center text-sm">
            已有账户？{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              立即登录
            </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
