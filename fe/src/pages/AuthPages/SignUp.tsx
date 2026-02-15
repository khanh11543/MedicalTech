import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | MedicalTech"
        description="Create your MedicalTech account - Medical Appointment System"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
