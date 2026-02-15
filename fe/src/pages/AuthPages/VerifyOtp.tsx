import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import VerifyOtpForm from "../../components/auth/VerifyOtpForm";

export default function VerifyOtp() {
  return (
    <>
      <PageMeta
        title="Verify OTP | MedicalTech"
        description="Verify your email with OTP code to complete registration"
      />
      <AuthLayout>
        <VerifyOtpForm />
      </AuthLayout>
    </>
  );
}
