"use client";
import WithMail from "@/common/WithMail";
import GoogleButton from "@/common/GoogleButton";
import GithubButton from "@/common/GithubButton";
import { useGoogleLogin, useGitHubLogin } from "@/hooks/useAuth";

function Register() {
  const { login: googleLogin } = useGoogleLogin();
  const { login: githubLogin } = useGitHubLogin();
  return (
    <div className="w-full space-y-5">
      <WithMail onClick={() => {}} />
      <GoogleButton onClick={() => googleLogin()} />
      <GithubButton onClick={() => githubLogin()} />
    </div>
  );
}

export default Register;
