<?php

namespace WebAuthn;

/**
 * @author Lukas Buchs
 * @license https://github.com/lbuchs/WebAuthn/blob/master/LICENSE MIT
 */
class WebAuthnException extends \Exception
{
    public const INVALID_DATA = 1;
    public const INVALID_TYPE = 2;
    public const INVALID_CHALLENGE = 3;
    public const INVALID_ORIGIN = 4;
    public const INVALID_RELYING_PARTY = 5;
    public const INVALID_SIGNATURE = 6;
    public const INVALID_PUBLIC_KEY = 7;
    public const CERTIFICATE_NOT_TRUSTED = 8;
    public const USER_PRESENT = 9;
    public const USER_VERIFICATED = 10;
    public const SIGNATURE_COUNTER = 11;
    public const CRYPTO_STRONG = 13;
    public const BYTEBUFFER = 14;
    public const CBOR = 15;

    public function __construct($message = "", $code = 0, $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
