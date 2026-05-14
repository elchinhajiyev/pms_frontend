import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Performix giriş səhifəsi"
        description="Performix platformasına daxil olun"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
