"""
MoMo Payment Test Script
Tests the MoMo payment integration with the MedicalTech backend
"""
import requests
import json
import base64

BASE_URL = "http://localhost:8080/api"

def login_receptionist():
    """Login as receptionist and get JWT token"""
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": "receptionist@test.com",
        "password": "password123"
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("accessToken")
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def create_payment(token, patient_id=1, doctor_id=1, appointment_id=None, amount=50000):
    """Create a new payment"""
    url = f"{BASE_URL}/receptionist/payments/create"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "amount": amount,
        "notes": "Test MoMo payment"
    }
    if appointment_id:
        payload["appointmentId"] = appointment_id
    
    response = requests.post(url, json=payload, headers=headers)
    print(f"Create Payment Response: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    return response.json() if response.status_code in [200, 201] else None

def init_momo_payment(token, payment_id):
    """Initialize MoMo payment for existing payment"""
    url = f"{BASE_URL}/receptionist/payments/{payment_id}/momo/init"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers)
    print(f"Init MoMo Response: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    return response.json() if response.status_code in [200, 201] else None

def main():
    print("=" * 60)
    print("MoMo Payment Integration Test")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1. Logging in as receptionist...")
    token = login_receptionist()
    if not token:
        print("Failed to login!")
        return
    print(f"Token obtained: {token[:50]}...")
    
    # Step 2: Create payment
    print("\n2. Creating new payment...")
    payment = create_payment(token, amount=50000)
    if not payment:
        print("Failed to create payment!")
        return
    
    payment_id = payment.get("id")
    if not payment_id:
        print("No payment ID in response!")
        return
    print(f"Payment ID: {payment_id}")
    
    # Step 3: Init MoMo payment
    print("\n3. Initializing MoMo payment...")
    momo_result = init_momo_payment(token, payment_id)
    
    if momo_result and momo_result.get("payUrl"):
        print("\n" + "=" * 60)
        print("SUCCESS! MoMo Payment URL:")
        print(momo_result.get("payUrl"))
        print("=" * 60)
    else:
        print("\nMoMo initialization failed!")

if __name__ == "__main__":
    main()
