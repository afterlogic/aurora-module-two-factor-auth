<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Capsule\Manager as Capsule;

class CreateWebAuthnKeysTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Capsule::schema()->create('web_authn_keys', function (Blueprint $table) {
            $table->id('Id');
            $table->bigInteger('UserId')->default(0);
            $table->string('Name')->default('');
            $table->text('KeyData');
            $table->integer('CreationDateTime')->default(0);
            $table->integer('LastUsageDateTime')->default(0);
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
        Capsule::schema()->dropIfExists('web_authn_keys');
    }
}
