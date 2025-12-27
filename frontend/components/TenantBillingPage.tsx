import { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Home, Zap, Building, Car, AlertTriangle, IndianRupee, Save } from 'lucide-react';
import { User, NewRecordData } from '../types';
import { formatINR, formatINRWithDecimals } from '../utils/currency';
import { userAPI } from '../utils/api';
import { getProfileImageUrl } from '../utils/images';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface TenantBillingPageProps {
    tenant: User;
    onBack: () => void;
    onAddRecord: (record: NewRecordData) => Promise<any>;
    onUpdateRecord: (recordId: string, data: any) => Promise<any>;
    onUpdateTenant: (tenant: User) => void;
}

export default function TenantBillingPage({ tenant, onBack, onAddRecord, onUpdateRecord, onUpdateTenant }: TenantBillingPageProps) {
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingBill, setIsCreatingBill] = useState(false);

    // Tenant settings state
    const [settings, setSettings] = useState({
        unit: tenant.unit || '',
        rentAmount: tenant.rentAmount || 0,
        electricityRate: tenant.electricityRate || 0,
        electricityUnits: tenant.electricityUnits || 0,
        municipalFee: tenant.municipalFee || 0,
        parkingCharges: tenant.parkingCharges || 0,
        penalties: tenant.penalties || 0,
        dues: tenant.dues || 0,
        advancePaid: tenant.advancePaid || 0,
    });

    // New bill state
    const [billData, setBillData] = useState({
        month: MONTHS[new Date().getMonth()],
        year: new Date().getFullYear().toString(),
        rent: tenant.rentAmount || 0,
        electricityUnits: 0,
        electricityRate: tenant.electricityRate || 0,
        municipalFee: tenant.municipalFee || 0,
        parking: tenant.parkingCharges || 0,
        penalties: 0,
        dues: tenant.dues || 0,
        advanceCredit: tenant.advancePaid || 0,
    });

    // Auto-calculate electricity bill
    const electricityBill = billData.electricityUnits * billData.electricityRate;

    // Calculate total (add dues, subtract advance credit)
    const subtotal = billData.rent + electricityBill + billData.municipalFee + billData.parking + billData.penalties + billData.dues;
    const total = Math.max(0, subtotal - billData.advanceCredit);

    // Sync billData when tenant settings change
    useEffect(() => {
        setBillData({
            month: MONTHS[new Date().getMonth()],
            year: new Date().getFullYear().toString(),
            rent: tenant.rentAmount || 0,
            electricityUnits: tenant.electricityUnits || 0,
            electricityRate: tenant.electricityRate || 0,
            municipalFee: tenant.municipalFee || 0,
            parking: tenant.parkingCharges || 0,
            penalties: tenant.penalties || 0,
            dues: tenant.dues || 0,
            advanceCredit: tenant.advancePaid || 0,
        });
        setSettings({
            unit: tenant.unit || '',
            rentAmount: tenant.rentAmount || 0,
            electricityRate: tenant.electricityRate || 0,
            electricityUnits: tenant.electricityUnits || 0,
            municipalFee: tenant.municipalFee || 0,
            parkingCharges: tenant.parkingCharges || 0,
            penalties: tenant.penalties || 0,
            dues: tenant.dues || 0,
            advancePaid: tenant.advancePaid || 0,
        });
    }, [tenant._id, tenant.rentAmount, tenant.electricityRate, tenant.electricityUnits, tenant.municipalFee, tenant.parkingCharges, tenant.unit, tenant.penalties, tenant.dues, tenant.advancePaid]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await userAPI.updateProfile(tenant._id, settings);
            onUpdateTenant(response.user);
            // Immediately update bill form with new settings
            setBillData(prev => ({
                ...prev,
                rent: settings.rentAmount,
                electricityRate: settings.electricityRate,
                municipalFee: settings.municipalFee,
                parking: settings.parkingCharges,
            }));
            setIsEditingSettings(false);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
        setIsSaving(false);
    };

    const handleCreateBill = async () => {
        setIsCreatingBill(true);
        try {
            const recordData: any = {
                tenantId: tenant._id,
                month: billData.month,
                year: billData.year,
                rent: billData.rent,
                electricity: electricityBill,
                electricityUnits: billData.electricityUnits,
                electricityRate: billData.electricityRate,
                municipalFee: billData.municipalFee,
                parking: billData.parking,
                penalties: billData.penalties,
                dues: billData.dues,
                advanceCredit: billData.advanceCredit,
                paid: false,
            };
            const result = await onAddRecord(recordData);
            // Reset form - clear dues and advance since they're used
            setBillData(prev => ({
                ...prev,
                electricityUnits: 0,
                penalties: 0,
                dues: 0,
                advanceCredit: 0,
            }));
            // Show appropriate message
            if (result?._wasUpdated) {
                alert(`Bill for ${billData.month} ${billData.year} was updated successfully!`);
            } else {
                alert('Bill created successfully!');
            }
        } catch (error) {
            console.error('Error creating bill:', error);
        }
        setIsCreatingBill(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Tenants</span>
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Tenant Header Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-4">


                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            {tenant.profilePicture ? (
                                <img src={getProfileImageUrl(tenant.profilePicture)} alt={tenant.name} className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <UserIcon className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{tenant.name}</h1>
                            <p className="text-indigo-200">{tenant.email}</p>
                            <p className="text-sm text-indigo-200 mt-1">Unit: {tenant.unit || 'Not set'}</p>
                        </div>
                    </div>
                </div>

                {/* Tenant Settings Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Tenant Settings</h2>
                        {!isEditingSettings ? (
                            <button onClick={() => setIsEditingSettings(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Edit Settings
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingSettings(false)} className="text-slate-500 hover:text-slate-700 px-3 py-1 text-sm">
                                    Cancel
                                </button>
                                <button onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Base Rent</label>
                            {isEditingSettings ? (
                                <input type="number" value={settings.rentAmount} onChange={(e) => setSettings(prev => ({ ...prev, rentAmount: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-slate-800">{formatINR(tenant.rentAmount || 0)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">⚡ Elec. Units</label>
                            {isEditingSettings ? (
                                <input type="number" value={settings.electricityUnits} onChange={(e) => setSettings(prev => ({ ...prev, electricityUnits: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-yellow-600">{tenant.electricityUnits || 0} units</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">⚡ Elec. Rate</label>
                            {isEditingSettings ? (
                                <input type="number" step="0.1" value={settings.electricityRate} onChange={(e) => setSettings(prev => ({ ...prev, electricityRate: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-yellow-600">{formatINRWithDecimals(tenant.electricityRate || 0)}/unit</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Municipal Fee</label>
                            {isEditingSettings ? (
                                <input type="number" value={settings.municipalFee} onChange={(e) => setSettings(prev => ({ ...prev, municipalFee: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-slate-800">{formatINR(tenant.municipalFee || 0)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Parking Charges</label>
                            {isEditingSettings ? (
                                <input type="number" value={settings.parkingCharges} onChange={(e) => setSettings(prev => ({ ...prev, parkingCharges: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-slate-800">{formatINR(tenant.parkingCharges || 0)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Penalties</label>
                            {isEditingSettings ? (
                                <input type="number" value={settings.penalties || 0} onChange={(e) => setSettings(prev => ({ ...prev, penalties: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-red-600">{formatINR(tenant.penalties || 0)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Dues Fine</label>
                            {isEditingSettings ? (
                                <input type="number" value={settings.dues || 0} onChange={(e) => setSettings(prev => ({ ...prev, dues: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            ) : (
                                <p className="font-semibold text-orange-600">{formatINR(tenant.dues || 0)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Advance Paid</label>
                            <p className="font-semibold text-green-600">{formatINR(tenant.advancePaid || 0)}</p>
                            <p className="text-xs text-slate-400">Auto-updated from payments</p>
                        </div>
                    </div>
                </div>

                {/* Create New Bill Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Create Monthly Bill</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Month</label>
                            <select value={billData.month} onChange={(e) => setBillData(prev => ({ ...prev, month: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Year</label>
                            <select value={billData.year} onChange={(e) => setBillData(prev => ({ ...prev, year: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                {Array.from({ length: new Date().getFullYear() - 2020 + 3 }, (_, i) => (2020 + i).toString()).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Rent */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Home className="w-5 h-5 text-blue-600" />
                                <span className="font-medium">Rent</span>
                            </div>
                            <input type="number" value={billData.rent} onChange={(e) => setBillData(prev => ({ ...prev, rent: Number(e.target.value) }))} className="w-32 text-right border border-slate-300 rounded px-3 py-1 text-sm" />
                        </div>

                        {/* Electricity */}
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-yellow-600" />
                                    <span className="font-medium">Electricity</span>
                                </div>
                                <span className="font-bold text-slate-800">{formatINR(electricityBill)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 ml-8">
                                <div className="flex items-center gap-2">
                                    <label>Units:</label>
                                    <input type="number" value={billData.electricityUnits} onChange={(e) => setBillData(prev => ({ ...prev, electricityUnits: Number(e.target.value) }))} className="w-20 border border-slate-300 rounded px-2 py-1 text-sm" />
                                </div>
                                <span>×</span>
                                <div className="flex items-center gap-2">
                                    <label>Rate:</label>
                                    <input type="number" value={billData.electricityRate} onChange={(e) => setBillData(prev => ({ ...prev, electricityRate: Number(e.target.value) }))} className="w-20 border border-slate-300 rounded px-2 py-1 text-sm" />
                                </div>
                                <span>=</span>
                                <span className="font-semibold">{formatINR(electricityBill)}</span>
                            </div>
                        </div>

                        {/* Municipal Fee */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Building className="w-5 h-5 text-purple-600" />
                                <span className="font-medium">Municipal Corporation Fee</span>
                            </div>
                            <input type="number" value={billData.municipalFee} onChange={(e) => setBillData(prev => ({ ...prev, municipalFee: Number(e.target.value) }))} className="w-32 text-right border border-slate-300 rounded px-3 py-1 text-sm" />
                        </div>

                        {/* Parking */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Car className="w-5 h-5 text-green-600" />
                                <span className="font-medium">Parking Charges</span>
                            </div>
                            <input type="number" value={billData.parking} onChange={(e) => setBillData(prev => ({ ...prev, parking: Number(e.target.value) }))} className="w-32 text-right border border-slate-300 rounded px-3 py-1 text-sm" />
                        </div>

                        {/* Penalties */}
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="font-medium text-red-800">Penalties</span>
                            </div>
                            <input type="number" value={billData.penalties} onChange={(e) => setBillData(prev => ({ ...prev, penalties: Number(e.target.value) }))} className="w-32 text-right border border-red-300 rounded px-3 py-1 text-sm" />
                        </div>

                        {/* Dues */}
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <IndianRupee className="w-5 h-5 text-orange-600" />
                                <span className="font-medium text-orange-800">Previous Dues</span>
                            </div>
                            <input type="number" value={billData.dues} onChange={(e) => setBillData(prev => ({ ...prev, dues: Number(e.target.value) }))} className="w-32 text-right border border-orange-300 rounded px-3 py-1 text-sm" />
                        </div>

                        {/* Advance Credit */}
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <IndianRupee className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-800">Advance Credit (Deduction)</span>
                            </div>
                            <input type="number" value={billData.advanceCredit} onChange={(e) => setBillData(prev => ({ ...prev, advanceCredit: Number(e.target.value) }))} className="w-32 text-right border border-green-300 rounded px-3 py-1 text-sm" />
                        </div>
                    </div>

                    {/* Total */}
                    <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span>{formatINR(subtotal)}</span>
                        </div>
                        {billData.advanceCredit > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                                <span>Less: Advance Credit</span>
                                <span>- {formatINR(billData.advanceCredit)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-slate-100">
                            <span>Total Amount</span>
                            <span className="text-indigo-600">{formatINR(total)}</span>
                        </div>
                    </div>

                    {/* Create Bill Button */}
                    <button onClick={handleCreateBill} disabled={isCreatingBill} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" />
                        {isCreatingBill ? 'Creating Bill...' : 'Create Bill for ' + billData.month + ' ' + billData.year}
                    </button>
                </div>
            </div>
        </div>
    );
}
