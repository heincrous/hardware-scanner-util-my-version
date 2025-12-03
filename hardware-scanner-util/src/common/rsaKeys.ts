type RSAKeys = { e: string; n: string };
type ZARSAKeys = Record<number, { block128: RSAKeys; block74: RSAKeys }>;

export const RSA_KEYS: ZARSAKeys = {
  1: {
    block128: {
      e: "bb797ffdec7f9e42c9d6f79b137059db",
      n: "\nfed2e1c2 7e336331 6e77317a 7a52c549\n81395186 be497476 0c72518d 63e0544a\n48d088b3 32c5b0c3 70c765d6 5d983c1f\n9de0a42b 310ccc07 ae770bd2 b61d6a4d\ncceac757 689bdcbf 608478fa f312f608\n7cc496c3 762cf5c4 651caecd a3499fae\n7edb7eb4 0e3e18eb 304170e9 1ed5b156\naace6f43 2d6eca6c c35851de 8c678f67\n"
    },
    block74: {
      e: "db05ba822d9acc33fab7d8f427f9ce65",
      n: "\nff3cec6b 5f40e3c3 661451b9 fcfaef3a\neb06dc23 29c0e6f4 dccc9279 726716ce\n15bbe05e ed2c5711 bcf8f5b6 c8f7276d\nb5c43bfa a3040dc0 1ab14b9c 4d16f71c\n0ce5ea95 3f0c754c 6b17\n"
    }
  },
  2: {
    block128: {
      e: "187092da6454ceb1853e6915f8466a05",
      n: "\nca9f18ef 6c3f3fa4 c5a461fe a54ab194\n06ba5ecd 746d60a2 7492dca3 d74e3b5c\n1d315f7b 10383241 809b029e bbd5de4d\n116030cc 57f7d5a6 c9a16f37 3bb14a50\n8523f7e8 0a4c744d 9085663a 4a1472d7\naf2c56ae 41b5065f 7efa0293 bd3278ad\n693546f9 f16219b7 9ff471a3 636824cf\nfcdb63a8 ed8059e6 b9a4f0db 895381cb\n"
    },
    block74: {
      e: "309cfed9 719fe2a5 e20c9bb4 4765382b",
      n: "\nb404a0df 11d1cacf f1a1a048 d4d573f9\n53a62c58 3d749259 27561a6d 7a1e2b14\n042526af 70b55054 7390ea6e c748d30f\ndb81adb4 90e0c36a 1986b404 b2f5f69e\nf5da1b66 3e595091 30e7\n"
    }
  },
};