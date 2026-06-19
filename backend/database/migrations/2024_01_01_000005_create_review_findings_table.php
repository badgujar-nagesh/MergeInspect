<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->enum('category', ['security', 'performance', 'quality', 'architecture']);
            $table->enum('severity', ['critical', 'high', 'medium', 'low', 'info']);
            $table->string('file_path', 500);
            $table->integer('line_number')->nullable();
            $table->text('issue');
            $table->text('recommendation');
            $table->bigInteger('github_comment_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_findings');
    }
};
