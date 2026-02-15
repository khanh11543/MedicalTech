import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | MedicalTech"
        description="Sign in to MedicalTech Dashboard - Medical Appointment System"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
