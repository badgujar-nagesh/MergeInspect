<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pull_request_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('overall_score')->default(0);
            $table->tinyInteger('security_score')->default(0);
            $table->tinyInteger('performance_score')->default(0);
            $table->tinyInteger('quality_score')->default(0);
            $table->tinyInteger('architecture_score')->default(0);
            $table->json('ai_raw_response')->nullable();
            $table->string('ai_provider')->default('openai'); // openai | claude
            $table->string('ai_model')->nullable();
            $table->boolean('posted_to_github')->default(false);
            $table->bigInteger('github_review_id')->nullable();
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
