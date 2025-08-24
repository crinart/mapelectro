"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormData = z.infer<typeof schema>;

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (isRegister) {
      await supabase.auth.signUp({ email: data.email, password: data.password });
    } else {
      await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    }
  };

  return (
    <main className="max-w-sm mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">
        {isRegister ? "Регистрация" : "Вход"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div>
          <input
            className="w-full border rounded p-2 text-black"
            placeholder="Email"
            type="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-400 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            className="w-full border rounded p-2 text-black"
            placeholder="Пароль"
            type="password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-400 text-sm">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full">
          {isRegister ? "Зарегистрироваться" : "Войти"}
        </Button>
      </form>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setIsRegister((p) => !p)}
      >
        {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Регистрация"}
      </Button>
    </main>
  );
}
