/**
 * Sample Consultation Data - Demo
 * Bệnh nhân: Pham Dinh Gia Bao
 */

export const SAMPLE_CONSULTATION_DATA = {
  chiefComplaint: 'Cough, sore throat, and runny nose for 3 days',
  hpi: `Patient presents with a 3-day history of dry cough, sore throat, and rhinorrhea. 
Symptoms started gradually and have remained mild to moderate in severity. 
No chest pain, no shortness of breath, and no hemoptysis. 
Patient reports mild fatigue but is still able to eat and drink normally. 
No known sick contacts. No significant worsening since onset.`,
  
  // Vital Signs
  temperature: 36.5,
  systolic: 120,
  diastolic: 80,
  heartRate: 72,
  respiratoryRate: 16,
  
  // Body Measurements
  height: 170,
  weight: 70,
  
  // Physical Exam
  peGeneral: 'Alert, oriented, no acute distress',
  peCardiovascular: 'Regular rate and rhythm, no murmurs',
  peRespiratory: 'Clear to auscultation bilaterally, no wheezes or crackles',
  peAbdomen: 'Soft, non-tender, non-distended, normoactive bowel sounds',
  peNeurological: 'CN II-XII intact, normal gait, sensation intact',
  
  // Diagnosis
  diagnosis: 'Acute upper respiratory tract infection',
  secondaryDiagnosis: 'Viral pharyngitis',
  diagnosticCode: 'J06.9',
  
  // Treatment Plan
  plan: 'Supportive treatment for likely viral upper respiratory infection. Advise rest, hydration, and symptom monitoring. No indication for antibiotics at this time.',
  medicationsPlanned: `Paracetamol for fever or throat pain if needed
Cough medicine or throat lozenges as needed
Saline nasal spray for nasal congestion`,
  investigationPlanned: 'No investigations required at this time if symptoms remain mild. Consider CBC or chest X-ray only if symptoms worsen or persist',
  referrals: 'No specialist referral needed currently',
  
  // Follow-up
  followUpInstructions: `Return for follow-up in 3 to 5 days if symptoms do not improve, or sooner if fever develops, breathing becomes difficult, cough worsens, or oral intake decreases. Home care includes adequate rest, warm fluids, and mask use if coughing.`,
};
