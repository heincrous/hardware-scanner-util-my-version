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

    public static void main(String[] args) throws Exception {
        String sampleBase64_DC = "AZsJRQAAYOmieh5HX4mvF8s6Wuhr2RFS0i+8ofRiuovTnpNBuyatguOrG05oBpJHt1KG7bZP7UdsGkRLun/+yorJ3c9imsWCqGW47v7GgvM95A5opvwIJl34atBYN221bkqdKi2ihdEfQIST+0cGq8NGYyoVa1F8h7WDcqOv2ovhHbrkqPWj0YgVWc4MaazQJncP2edcKMSr0LJ5bnDsqJTYVGvYRWvc2a8KoRL3i1ZSNHG0aAWuhEpmEIui8SooGA5d3e1IQ2I56uISxhk9NRIB5qJGE9JILdrlUr9+IXKSRmZ6nNXHMLpLgHNlhvX5CJSxAX/Op7KZzWJBombEt7KLcE3h8CZgJTWNE0aG4crCupr3TqFrlST0/KIHktJhi+7ISZ26tZb1pWUx8mRiyZba1eEnhAClJmxbWu0t08rhNYIRSL39PVZKwSfJDToSUDHLJj5jh5390Qcl3IAiWnAOXSWaWh0jQNe9LT/sybB44XJmYeLFG5RbVtdi+jBn8rkm3ScHp04VNavxp+4JsOxAaJzTs7mZXf3am18zSC8UQa+kgwSmiyS5QkZNAzTUsgwXpvCdXbEZJXIS97LUiGDiLGSSTcU8A1V2JKAgsXXvR1U5Rs4uYMPyupWGXXOy1EDC/T6zyYUER8JJyGlETbwQPYGXxVVjVebEZFW2GqCxdrzHMpC1MnJtQzm7NbFE/s9cXUxekK7yP8nJN1rnIG+epaIiVTZffgco4zYMt4ViyAWk+aK0pnTrWvMLWYuYsWInoiNQXi4BPkJilujz0f8D1lBvpDEWJDivq7xOi5Ym6IIda9Jk/501ot+Q4r4n4Cl8FioKa7yTfzSdMUE0hLUsonJVsiY6veJ5PLlGOHaF3pZid3zfaAihjDoldZ7U5qtkEPeIG2VUIb6H4/PfEABi8SroBgWco+ESSFVwgKZOTsbgpGaXyuTFxRl+Pe/c";

        byte[] buffer = java.util.Base64.getDecoder().decode(sampleBase64_DC);
        LicenseInfo info = new Decoder().decodeLicenseBarcode(buffer);

        System.out.println("Initials: " + info.getInitials());
        System.out.println("Surname: " + info.getSurname());
        System.out.println("ID: " + info.getIdNumber());
        // System.out.println("Raw image size: " + info.getRawImage().length);

        byte[] photo = Decoder.getDecodedPhoto(
            Decoder.toPrimitives(info.getRawImage()),
            info.getRawImage().length
        );

        // System.out.println("Decoded photo bytes: " + photo.length);

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
