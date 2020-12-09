# Aurora two factor auth module

# License
This module is licensed under Afterlogic Software License. Please read LICENSE for more information.

To get app-key-hash use one of the following way:
1. ```keytool -exportcert -alias KEY_ALIAS -keystore key.jks | openssl sha256 -binary | openssl base64 | sed 's/=//g' | tr '+' '-' | tr '/' '_' ```

2. ```APP_SIGN_KEY_FINGERPRINT | xxd -r -p | openssl base64 | sed 's/=//g' | tr '+' '-' | tr '/' '_' ```
