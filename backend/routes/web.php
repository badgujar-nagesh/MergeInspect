<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

function authorizeDeploymentCommand()
{
    $provided = request()->header('X-Deploy-Secret');

    abort_unless(
        hash_equals(env('DEPLOY_SECRET'), $provided ?? ''),
        403,
        'Unauthorized'
    );
}

Route::get('/', function () {
    return view('welcome');
});

Route::get('/system/migrate', function () {

    authorizeDeploymentCommand();

    Artisan::call('migrate', [
        '--force' => true
    ]);

    return response()->json([
        'success' => true,
        'output' => Artisan::output(),
    ]);
});

Route::get('/system/seed', function () {

    authorizeDeploymentCommand();

    Artisan::call('db:seed', [
        '--force' => true
    ]);

    return response()->json([
        'success' => true,
        'output' => Artisan::output(),
    ]);
});

Route::get('/system/cache-clear', function () {

    authorizeDeploymentCommand();

    Artisan::call('optimize:clear');

    return response()->json([
        'success' => true,
        'output' => Artisan::output(),
    ]);
});
