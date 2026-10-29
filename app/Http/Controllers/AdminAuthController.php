<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $email = trim((string) $request->input('email', ''));
        $password = $request->input('password');
        if ($email === '' || !is_string($password) || $password === '') {
            return response()->json(['message' => 'Email dan kata sandi wajib diisi.'], 400);
        }

        $admin = DB::table('global_admin')->where('singleton', true)->first();
        if (!$admin || strtolower($admin->email) !== strtolower($email) || !Hash::check($password, $admin->password_hash)) {
            return response()->json(['message' => 'Email atau kata sandi salah.'], 401);
        }

        $request->session()->regenerate();
        $request->session()->put('admin_id', 'global-admin');

        return response()->json([
            'user' => ['id' => 'global-admin', 'email' => $admin->email, 'nama' => $admin->display_name],
        ]);
    }

    public function currentUser(Request $request): JsonResponse
    {
        $admin = DB::table('global_admin')->where('singleton', true)->first();
        if (!$admin) {
            $request->session()->forget('admin_id');
            return response()->json(['message' => 'Akun admin tidak tersedia.'], 401);
        }

        return response()->json([
            'user' => ['id' => 'global-admin', 'email' => $admin->email, 'nama' => $admin->display_name],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }
}
