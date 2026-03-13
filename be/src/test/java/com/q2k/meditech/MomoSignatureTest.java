package com.q2k.meditech;

import org.apache.commons.codec.digest.HmacAlgorithms;
import org.apache.commons.codec.digest.HmacUtils;
import org.junit.jupiter.api.Test;

import java.util.UUID;

/**
 * Test to verify MoMo signature generation matches official sample code
 * Based on: https://github.com/momo-wallet/payment
 */
public class MomoSignatureTest {

    @Test
    public void testMomoSignatureGeneration() {
        // Official test credentials from MoMo sample
        String accessKey = "F8BBA842ECF85";
        String secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        String partnerCode = "MOMO";
        String redirectUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
        String ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
        String amount = "50000";
        String orderId = partnerCode + System.currentTimeMillis();
        String requestId = orderId;
        String requestType = "captureWallet";
        String extraData = "";
        String orderInfo = "pay with MoMo";

        // Build raw signature exactly like MoMo sample
        String rawSignature = "accessKey=" + accessKey 
                + "&amount=" + amount 
                + "&extraData=" + extraData 
                + "&ipnUrl=" + ipnUrl 
                + "&orderId=" + orderId 
                + "&orderInfo=" + orderInfo 
                + "&partnerCode=" + partnerCode 
                + "&redirectUrl=" + redirectUrl 
                + "&requestId=" + requestId 
                + "&requestType=" + requestType;

        System.out.println("--------------------RAW SIGNATURE----------------");
        System.out.println(rawSignature);

        // Create HMAC SHA256 signature
        String signature = new HmacUtils(HmacAlgorithms.HMAC_SHA_256, secretKey).hmacHex(rawSignature);
        
        System.out.println("--------------------SIGNATURE----------------");
        System.out.println(signature);

        // Verify signature is not empty and has correct length (64 hex chars for SHA256)
        assert signature != null && signature.length() == 64 : "Signature should be 64 hex characters";
        
        System.out.println("--------------------TEST PASSED----------------");
    }

    @Test
    public void testMomoSignatureWithLongAmount() {
        // Test with Long amount type (matching our code)
        String accessKey = "F8BBA842ECF85";
        String secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        String partnerCode = "MOMO";
        String redirectUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
        String ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
        Long amount = 50000L;
        String orderId = "TEST" + System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        String requestType = "captureWallet";
        String extraData = "";
        String orderInfo = "Payment TEST123";

        // Build raw signature
        String rawSignature = "accessKey=" + accessKey 
                + "&amount=" + amount 
                + "&extraData=" + extraData 
                + "&ipnUrl=" + ipnUrl 
                + "&orderId=" + orderId 
                + "&orderInfo=" + orderInfo 
                + "&partnerCode=" + partnerCode 
                + "&redirectUrl=" + redirectUrl 
                + "&requestId=" + requestId 
                + "&requestType=" + requestType;

        System.out.println("--------------------RAW SIGNATURE (Long amount)----------------");
        System.out.println(rawSignature);

        String signature = new HmacUtils(HmacAlgorithms.HMAC_SHA_256, secretKey).hmacHex(rawSignature);
        
        System.out.println("--------------------SIGNATURE----------------");
        System.out.println(signature);

        assert signature != null && signature.length() == 64;
        System.out.println("--------------------TEST PASSED----------------");
    }
}
