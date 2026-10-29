<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AgencyController extends Controller
{
    public function index(): JsonResponse
    {
        $agencies = DB::table('government_agencies')
            ->select(['name', 'agency_type as agencyType', 'region'])
            ->orderBy('name')
            ->get();

        return response()->json(['agencies' => $agencies]);
    }
}
