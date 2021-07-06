<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Capsule\Manager as Capsule;

class CreateUsedDevicesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Capsule::schema()->create('used_devices', function (Blueprint $table) {
            $table->id('Id');
            $table->bigInteger('UserId')->default(0);
            $table->string('DeviceId')->default('');
            $table->string('DeviceName')->default('');
            $table->text('AuthToken');
            $table->integer('CreationDateTime')->default(0);
            $table->integer('LastUsageDateTime')->default(0);
            $table->integer('TrustTillDateTime')->default(0);
            $table->string('DeviceIP')->default('');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Capsule::schema()->dropIfExists('used_devices');
    }
}
