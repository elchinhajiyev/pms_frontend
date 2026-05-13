import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Performix Qeydiyyat Səhifəsi"
        description="Performix platformasında yeni istifadəçi hesabı yaradın və tədris fəaliyyətlərinizi effektiv idarə edin."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
