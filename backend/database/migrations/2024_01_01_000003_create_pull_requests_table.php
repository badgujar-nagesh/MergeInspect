<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pull_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repository_id')->constrained()->cascadeOnDelete();
            $table->integer('pr_number');
            $table->string('title');
            $table->string('author');
            $table->string('head_sha');
            $table->enum('state', ['open', 'closed', 'merged'])->default('open');
            $table->timestamps();

            $table->unique(['repository_id', 'pr_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pull_requests');
    }
};
