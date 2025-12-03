package com.peachss.sadldecoder;
import com.peachss.sadldecoder.Decoder;
import com.peachss.sadldecoder.utils.LicenseInfo;

import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class Test {

    private static byte[] flipVertical(byte[] src, int width, int height) {
        byte[] out = new byte[src.length];
        int row = width;
        for (int y = 0; y < height; y++) {
            int srcPos = y * row;
            int dstPos = (height - 1 - y) * row;
            System.arraycopy(src, srcPos, out, dstPos, row);
        }
        return out;
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    public static void main(String[] args) throws Exception {
        String sampleBase64_DC = "AZsJRQAADMa+GSMDRzwILcEP2wvnyockv3+O66ATR8lXE+99cy+6uaQAI9od+aCrfZwnyiwkZ9of4BXC6dgw1htX71bC6TjAZPKCC84iP7Ao10USiBbi9UBQOyjrceQ6Rq3wiZHyMH1uGfPLJQn3OwlK3yd0S3IUjls6xKTiAO1/l6odlvZH3QOUWMm2w3f867V+fJx+I21M+K1zxylI2iMxWiZOX2M+55t5GdSxwTYDzu49VioqtJoTUveenkz9mSnsXUcQ3Nn8HxYlJre016YIDnk5ugxq7hlVy1E1rc8h/v/JQG3nT/HogxSTZkPj6xRi5ut/JSSFkhnQA45KbXgrp8DDv7TrJN78NhiFI7F99GYbgPYgn91Zy/DpKhkCGGuJazkJVEoIZd1NdwKYfwQn1y1ndFOwPmcugM4dFGwRPYgbFVAuociZ0WobzV+Mv31xgIfFY0zlGEsQaSaibwCjVWQcLHHKkqx5yt8zYmfCPMiE0MR/mcyDcQ4yFUqdH0yqtCdTGW2g0Mihz91SDjCHYuv5qaYjxVyzaz6FgcmU2+wcadNXRyC0Agjh2/L29ySFqsaSfHJVFtEiQ4sb80ynmELRHVum+89BLQCyXChupq7/tioD898WRKurLPP7xw+NOZf88EWxDDsNmzaZ9XzZVSArAduzL7kuEdNFFXit41XFbHdYsuRZuHR3sRMog8RFjgM1YJZ1UFblbKBNF6l5MsLi3RveLaVL42oAOTM+CvE45v/wU0r/ia+VVEmabMGDpRFKjG6I0HI3vY4pvQZBtiSN7A4+UUxQYzfahauSsbnI21RrkBXiND7Sue9QN6eqXlLPaOtcebRXzQxN4tG2JpD76iLGJY/qeffTL3mfBdmUshrmtvn2cMyVYIdBPFSfLyisWG2ZuzoGPqY2f7B20X+j6k2GMiZJhVp5bH27SZAeHva/ZPHNacVk+IKt";

        byte[] buffer = java.util.Base64.getDecoder().decode(sampleBase64_DC);

        // Print buffer in hex
        System.out.println("Buffer in hex: " + toHex(buffer));

        LicenseInfo info = new Decoder().decodeLicenseBarcode(buffer);

        System.out.println("Initials: " + info.getInitials());
        System.out.println("Surname: " + info.getSurname());
        System.out.println("ID: " + info.getIdNumber());

        byte[] photo = Decoder.getDecodedPhoto(
            Decoder.toPrimitives(info.getRawImage()),
            info.getRawImage().length
        );

        int width = 200;
        int height = 250;

        byte[] flipped = flipVertical(photo, width, height);

        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        img.getRaster().setDataElements(0, 0, width, height, flipped);

        File outFile = new File("decoded.png");
        ImageIO.write(img, "png", outFile);

        System.out.println("Wrote decoded.png");
    }
}
