<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Capsule\Manager as Capsule;

class AddAuthTokenHashToSecurityUsedDevicesTable extends Migration
{
    public function up()
    {
        $prefix = Capsule::connection()->getTablePrefix();
        $sm = Capsule::connection()->getDoctrineSchemaManager();
        $doctrineTable = $sm->listTableDetails($prefix . 'security_used_devices');

        if ($doctrineTable->hasColumn('AuthToken') && !$doctrineTable->hasColumn('AuthTokenHash')) {
            Capsule::connection()->statement(
                "ALTER TABLE `{$prefix}security_used_devices` CHANGE `AuthToken` `AuthTokenHash` TEXT NOT NULL"
            );

            // Hash all existing plain text tokens
            Capsule::connection()->statement(
                "UPDATE `{$prefix}security_used_devices` SET `AuthTokenHash` = SHA2(`AuthTokenHash`, 256)"
            );
        }

        // Add index on AuthTokenHash
        $doctrineTable = $sm->listTableDetails($prefix . 'security_used_devices');
        if (!$doctrineTable->hasIndex('security_used_devices_auth_token_hash_index')) {
            Capsule::connection()->statement(
                "ALTER TABLE `{$prefix}security_used_devices` ADD INDEX `security_used_devices_auth_token_hash_index` (`AuthTokenHash`(255))"
            );
        }
    }

    public function down()
    {
        $prefix = Capsule::connection()->getTablePrefix();
        $sm = Capsule::connection()->getDoctrineSchemaManager();
        $doctrineTable = $sm->listTableDetails($prefix . 'security_used_devices');

        if ($doctrineTable->hasIndex('security_used_devices_auth_token_hash_index')) {
            Capsule::connection()->statement(
                "ALTER TABLE `{$prefix}security_used_devices` DROP INDEX `security_used_devices_auth_token_hash_index`"
            );
        }

        if ($doctrineTable->hasColumn('AuthTokenHash') && !$doctrineTable->hasColumn('AuthToken')) {
            Capsule::connection()->statement(
                "ALTER TABLE `{$prefix}security_used_devices` CHANGE `AuthTokenHash` `AuthToken` TEXT NOT NULL"
            );
        }
    }
}
