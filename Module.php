<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\TwoFactorAuth;
use PragmaRX\Recovery\Recovery;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public static $VerifyPinState = false;

	public function init()
	{
		$this->extendObject(\Aurora\Modules\Core\Classes\User::class, [
				'Secret' => ['string', '', false, true],
				'ShowRecommendationToConfigure' => ['bool', true],
				'IsEncryptedSecret' => ['bool', false],
				'BackupCodes' => ['string', false],
				'BackupCodesTimestamp' => ['string', false],
			]
		);

		$this->subscribeEvent('Core::Authenticate::after', array($this, 'onAfterAuthenticate'));
	}

	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
            $bShowRecommendationToConfigure = $this->getConfig('ShowRecommendationToConfigure', false);
            if ($bShowRecommendationToConfigure)
            {
                $bShowRecommendationToConfigure = $oUser->{$this->GetName().'::ShowRecommendationToConfigure'};
            }
			$sBackupCodes = \Aurora\System\Utils::DecryptValue($oUser->{$this->GetName().'::BackupCodes'});
			$aBackupCodes = empty($sBackupCodes) ? [] : json_decode($sBackupCodes);
			$aNotUsedBackupCodes = array_filter($aBackupCodes, function($sCode) { return !empty($sCode); });
			return [
				'EnableTwoFactorAuth' => $oUser->{$this->GetName().'::Secret'} ? true : false,
                'ShowRecommendationToConfigure' => $bShowRecommendationToConfigure,
				'BackupCodesCount' => count($aNotUsedBackupCodes),
			];
		}

		return null;
	}

    public function UpdateSettings($ShowRecommendationToConfigure)
    {
        if ($this->getConfig('ShowRecommendationToConfigure', false))
        {
            $oUser = \Aurora\System\Api::getAuthenticatedUser();
            if (!empty($oUser) && $oUser->isNormalOrTenant())
            {
                $oUser->{$this->GetName() . '::ShowRecommendationToConfigure'} = $ShowRecommendationToConfigure;
                return \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
            }
        }
        return false;
    }

	/**
	 * Obtains user settings. Method is allowed for superadmin only.
	 * @param int $UserId
	 * @return array|null
	 */
	public function GetUserSettings($UserId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oUser = \Aurora\System\Api::getUserById($UserId);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->isNormalOrTenant())
		{
			return [
				'EnableTwoFactorAuth' => $oUser->{$this->GetName().'::Secret'} ? true : false,
			];
		}

		return null;
	}

	/**
	 * Disables two factor authentication for specified user. Method is allowed for superadmin only.
	 * @param int $UserId
	 * @return boolean
	 */
	public function DisableUserTwoFactorAuth($UserId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oUser = \Aurora\System\Api::getUserById($UserId);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->isNormalOrTenant())
		{
			$oUser->{$this->GetName().'::Secret'} = '';
			$oUser->{$this->GetName().'::BackupCodes'} = '';
			$oUser->{$this->GetName().'::BackupCodesTimestamp'} = '';
			return \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
		}

		return false;
	}

	/**
	 * Verifies user's password and returns Secret and QR-code
	 *
	 * @param string $Password
	 * @return bool|array
	 */
	public function EnableTwoFactorAuth($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$mResult = false;

		if (!empty($Password))
		{
			$mResult = \Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password);
			if ($mResult)
			{
				$oUser = \Aurora\System\Api::getAuthenticatedUser();
				$oGoogle = new \PHPGangsta_GoogleAuthenticator();
				$sSecret = '';
				if ($oUser->{$this->GetName().'::Secret'})
				{
					$sSecret = $oUser->{$this->GetName().'::Secret'};
					if ($oUser->{$this->GetName().'::IsEncryptedSecret'})
					{
						$sSecret = \Aurora\System\Utils::DecryptValue($sSecret);
					}
				}
				else
				{
					$sSecret = $oGoogle->createSecret();;
				}
				$sQRCodeName = $oUser->PublicId . "(" . $_SERVER['SERVER_NAME'] . ")";

				$mResult = [
					'Secret' => $sSecret,
					'QRcode' => $oGoogle->getQRCodeGoogleUrl($sQRCodeName, $sSecret),
					'Enabled' => $oUser->{$this->GetName().'::Secret'} ? true : false
				];
			}
		}

		return $mResult;
	}

	/**
	 * Verifies user's Pin and saves Secret in case of success
	 *
	 * @param string $Pin
	 * @param string $Secret
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function TwoFactorAuthSave($Pin, $Secret)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;
		if (!$Pin || !$Secret || empty($Pin) || empty($Secret))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$iClockTolerance = $this->getConfig('ClockTolerance', 2);
		$oGoogle = new \PHPGangsta_GoogleAuthenticator();

		$oStatus = $oGoogle->verifyCode($Secret, $Pin, $iClockTolerance);
		if ($oStatus === true)
		{
			$oUser->{$this->GetName().'::Secret'} = \Aurora\System\Utils::EncryptValue($Secret);
			$oUser->{$this->GetName().'::IsEncryptedSecret'} = true;
			\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
			$bResult = true;
		}

		return $bResult;
	}

	/**
	 * Verifies user's Password and disables TwoFactorAuth in case of success
	 *
	 * @param string $Password
	 * @return bool
	 */
	public function DisableTwoFactorAuth($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$bResult = false;

		if (!empty($Password))
		{
			$bVerificationResult = \Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password);
			if ($bVerificationResult)
			{
				$oUser = \Aurora\System\Api::getAuthenticatedUser();
				$oUser->{$this->GetName().'::Secret'} = "";
				$oUser->{$this->GetName().'::IsEncryptedSecret'} = false;
				$oUser->{$this->GetName().'::BackupCodes'} = '';
				$oUser->{$this->GetName().'::BackupCodesTimestamp'} = '';
				$bResult = \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
			}
		}

		return $bResult;
	}

	/**
	 * Verifies user's PIN and returns AuthToken in case of success
	 *
	 * @param string $Pin
	 * @param int $UserId
	 * @return bool|array
	 * @throws \Aurora\System\Exceptions\ApiException
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function VerifyPin($Pin, $Login, $Password)
	{
		$mResult = false;

		if (!$Pin || empty($Pin) || empty($Login)  || empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		self::$VerifyPinState = true;
		$mAuthenticateResult = \Aurora\Modules\Core\Module::Decorator()->Authenticate($Login, $Password);
		self::$VerifyPinState = false;

		if ($mAuthenticateResult && is_array($mAuthenticateResult) && isset($mAuthenticateResult['token']))
		{
			$oUser = \Aurora\System\Api::getUserById((int) $mAuthenticateResult['id']);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				if ($oUser->{$this->GetName().'::Secret'})
				{
					$sSecret = $oUser->{$this->GetName().'::Secret'};
					if ($oUser->{$this->GetName().'::IsEncryptedSecret'})
					{
						$sSecret = \Aurora\System\Utils::DecryptValue($sSecret);
					}
					$oGoogle = new \PHPGangsta_GoogleAuthenticator();
					$iClockTolerance = $this->getConfig('ClockTolerance', 2);
					$oStatus = $oGoogle->verifyCode($sSecret, $Pin, $iClockTolerance);
					if ($oStatus)
					{
						$mResult = \Aurora\Modules\Core\Module::Decorator()->SetAuthDataAndGetAuthToken($mAuthenticateResult);
					}
				}
				else
				{
					throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::SecretNotSet);
				}
			}
		}

		return $mResult;
	}

    public function GetBackupCodes()
    {
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$sBackupCodes = \Aurora\System\Utils::DecryptValue($oUser->{$this->GetName().'::BackupCodes'});
            return [
                'Datetime' => $oUser->{$this->GetName().'::BackupCodesTimestamp'},
                'Codes' => empty($sBackupCodes) ? [] : json_decode($sBackupCodes)
            ];
		}
    }

    public function GenerateBackupCodes()
    {
        $oUser = \Aurora\System\Api::getAuthenticatedUser();
        if (!empty($oUser) && $oUser->isNormalOrTenant()) {
            $oRecovery = new Recovery();
            $aCodes = $oRecovery
                ->setCount(10) // Generate 10 codes
                ->setBlocks(2) // Every code must have 2 blocks
                ->setChars(4) // Each block must have 4 chars
                ->setBlockSeparator(' ')
                ->uppercase()
                ->toArray();
$aCodes[2] = '';
			$oUser->{$this->GetName().'::BackupCodes'} = \Aurora\System\Utils::EncryptValue(json_encode($aCodes));
			$oUser->{$this->GetName().'::BackupCodesTimestamp'} = time();
			\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);

            return [
                'Datetime' => $oUser->{$this->GetName().'::BackupCodesTimestamp'},
                'Codes' => $aCodes,
            ];
        }
    }

	/**
	 * Checks if User has TwoFactorAuth enabled and return UserId instead of AuthToken
	 *
	 * @param array $aArgs
	 * @param aray $mResult
	 */
	public function onAfterAuthenticate($aArgs, &$mResult)
	{
		if (!self::$VerifyPinState && $mResult && is_array($mResult) && isset($mResult['token']))
		{
			$oUser = \Aurora\System\Api::getUserById((int) $mResult['id']);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				if ($oUser->{$this->GetName().'::Secret'} !== "")
				{
					$mResult = [
						'TwoFactorAuth' => true
					];
				}
			}
		}
	}
}
