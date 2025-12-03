package com.peachss.sadldecoder;
import com.peachss.sadldecoder.Decoder;
import com.peachss.sadldecoder.utils.LicenseInfo;

import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;

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
        // Read Base64 from file
        String sampleBase64_DC = new String(Files.readAllBytes(Paths.get("com/peachss/sadldecoder/license_sample.base64"))).trim();

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
