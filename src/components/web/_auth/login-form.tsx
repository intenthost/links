"use client";
import { useEffect, useReducer } from "react";
import Link from "next/link";
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkUserExists,
  authClient,
  hardNavigate,
  POST_LOGIN_PATH,
} from "@/lib/auth-client";
import { clearWorkspaceSlugCookie } from "@/lib/workspace-cookie";
import { LoaderCircle } from "@/utils/icons/loader-circle";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/web/huge-icon";
import { toast } from "sonner";
import SocialLoginButtons from "./social-login-buttons";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Honour a safe `?next=` path (used by the browser-extension auth bridge)
 * so login resumes where it started. Falls back to the dashboard.
 */
function resolveNextPath(): string {
  if (typeof window === "undefined") return POST_LOGIN_PATH;

  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return POST_LOGIN_PATH;
  }

  return next;
}

type LoginUiState = {
  showPassword: boolean;
  isGithubLoading: boolean;
  isGoogleLoading: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  lastUsedProvider: string | null;
};

type LoginUiAction =
  | { type: "SET_SHOW_PASSWORD"; payload: boolean }
  | { type: "SET_GITHUB_LOADING"; payload: boolean }
  | { type: "SET_GOOGLE_LOADING"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_REDIRECTING"; payload: boolean }
  | { type: "SET_LAST_PROVIDER"; payload: string | null }
  | { type: "HYDRATE_LAST_PROVIDER"; payload: string | null };

const initialUiState: LoginUiState = {
  showPassword: false,
  isGithubLoading: false,
  isGoogleLoading: false,
  isLoading: false,
  isRedirecting: false,
  lastUsedProvider: null,
};

function loginUiReducer(state: LoginUiState, action: LoginUiAction) {
  switch (action.type) {
    case "SET_SHOW_PASSWORD":
      return { ...state, showPassword: action.payload };
    case "SET_GITHUB_LOADING":
      return { ...state, isGithubLoading: action.payload };
    case "SET_GOOGLE_LOADING":
      return { ...state, isGoogleLoading: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_REDIRECTING":
      return { ...state, isRedirecting: action.payload };
    case "SET_LAST_PROVIDER":
    case "HYDRATE_LAST_PROVIDER":
      return { ...state, lastUsedProvider: action.payload };
    default:
      return state;
  }
}

function PasswordField({
  showPassword,
  register,
  errors,
  disabled,
  onTogglePassword,
}: {
  showPassword: boolean;
  register: UseFormRegister<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  disabled: boolean;
  onTogglePassword: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">Password</Label>
        <Link
          className="text-muted-foreground text-xs underline"
          href="/forgot-password"
        >
          Forgot Password?
        </Link>
      </div>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          {...register("password", {
            required: "Password is required",
          })}
          className={cn(
            "w-full pr-10",
            errors.password && "border-red-500 focus-visible:ring-red-500",
          )}
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          {showPassword ? (
            <HugeIcon icon={ViewOffSlashIcon} className="h-4 w-4" />
          ) : (
            <HugeIcon icon={ViewIcon} className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, dispatch] = useReducer(loginUiReducer, initialUiState);
  const {
    showPassword,
    isGithubLoading,
    isGoogleLoading,
    isLoading,
    isRedirecting,
    lastUsedProvider,
  } = state;

  // Computed state: true if any authentication is in progress
  const isAnyAuthInProgress =
    isLoading || isGoogleLoading || isGithubLoading || isRedirecting;

  useEffect(() => {
    // Load last used provider from localStorage (client-side only)
    try {
      const savedProvider = localStorage.getItem("lastUsedProvider");
      if (
        savedProvider &&
        ["google", "github", "credential"].includes(savedProvider)
      ) {
        dispatch({ type: "HYDRATE_LAST_PROVIDER", payload: savedProvider });
      }
    } catch (error) {
      // localStorage might not be available in some environments
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to access localStorage:", error);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleLogin = async () => {
    dispatch({ type: "SET_GOOGLE_LOADING", payload: true });
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: resolveNextPath(),
      });
      try {
        localStorage.setItem("lastUsedProvider", "google");
      } catch {
        // ignore
      }
      // OAuth redirects the browser; if we return without redirect, stay loading.
    } catch (err) {
      dispatch({ type: "SET_GOOGLE_LOADING", payload: false });
      toast.error("An unexpected error occurred during Google login");
      console.error("Google login error:", err);
    }
  };

  const handleGithubLogin = async () => {
    dispatch({ type: "SET_GITHUB_LOADING", payload: true });
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: resolveNextPath(),
      });
      try {
        localStorage.setItem("lastUsedProvider", "github");
      } catch {
        // ignore
      }
    } catch (err) {
      dispatch({ type: "SET_GITHUB_LOADING", payload: false });
      console.error("GitHub login error:", err);
      toast.error(
        "An unexpected error occurred during GitHub login. Please try again.",
      );
    }
  };

  const handlePasswordLogin = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await authClient.signIn.email(
        {
          email,
          password,
          rememberMe: true,
        },
        {
          onSuccess: () => {
            try {
              localStorage.setItem("lastUsedProvider", "credential");
            } catch {
              // ignore
            }
            dispatch({ type: "SET_LAST_PROVIDER", payload: "credential" });
            dispatch({ type: "SET_REDIRECTING", payload: true });
            // Drop any previous account's workspace slug — "/" resolves the
            // signed-in user's workspace from scratch (middleware re-sets it).
            clearWorkspaceSlugCookie();
            hardNavigate(resolveNextPath());
          },
          onError: (err) => {
            dispatch({ type: "SET_LOADING", payload: false });
            dispatch({ type: "SET_REDIRECTING", payload: false });
            toast.error(
              err instanceof Error ? err.message : "Invalid email or password",
            );
          },
        },
      );
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: false });
      dispatch({ type: "SET_REDIRECTING", payload: false });
      toast.error("An unexpected error occurred during login");
      console.error("Login error:", err);
    }
  };

  const handleResendVerification = async (email: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await authClient.sendVerificationEmail({ email });
      toast.success("Verification email sent! Please check your inbox.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to send verification email",
      );
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const handleMagicLinkLogin = async (email: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await authClient.signIn.magicLink(
        {
          email,
          callbackURL: resolveNextPath(),
        },
        {
          onSuccess: () => {
            clearWorkspaceSlugCookie();
            toast.success("Magic link sent! Please check your email.");
          },
          onError: (err) => {
            toast.error(
              err instanceof Error ? err.message : "Failed to send magic link",
            );
          },
        },
      );
    } catch (err) {
      toast.error("An unexpected error occurred while sending magic link");
      console.error("Magic link error:", err);
    }
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const onSubmit = async (data: LoginFormData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const userData = await checkUserExists(data.username);

      if (!userData.exists) {
        toast.error("Invalid username or password");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const targetEmail = userData.email || data.username;
      await handlePasswordLogin(targetEmail, data.password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
      <Card className="mx-auto w-full border-none shadow-none">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect="off"
                {...register("username")}
                className={cn(
                  "w-full",
                  errors.username && "border-red-500 focus-visible:ring-red-500",
                )}
                required
                disabled={isAnyAuthInProgress}
              />
            </div>

            <PasswordField
              showPassword={showPassword}
              register={register}
              errors={errors}
              disabled={isAnyAuthInProgress}
              onTogglePassword={() =>
                dispatch({
                  type: "SET_SHOW_PASSWORD",
                  payload: !showPassword,
                })
              }
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 cursor-pointer"
                disabled={isAnyAuthInProgress || isSubmitting}
              >
                {isLoading && (
                  <LoaderCircle className="mr-1 h-2.5 w-2.5 animate-[spin_1.2s_linear_infinite]" />
                )}
                Sign in
              </Button>
            </div>

            <SocialLoginButtons
              handleGoogleLogin={handleGoogleLogin}
              handleGithubLogin={handleGithubLogin}
              isLoading={isAnyAuthInProgress}
              isSubmitting={isSubmitting}
              isGoogleLoading={isGoogleLoading}
              isGithubLoading={isGithubLoading}
              lastUsedProvider={lastUsedProvider}
            />

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
