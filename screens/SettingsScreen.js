import React, { useEffect, useState } from 'react';
import { View, Text, Image, Switch } from 'react-native';
import Toast from 'react-native-toast-message';
import { Screen, Field, Button, Footer, SectionTitle, Card, Loading, ErrorBox, s } from '../components/ui';
import { useLoad } from '../components/useData';
import { useAuth } from '../components/AuthContext';
import { api } from '../services/api';
import { pickAndUpload } from '../services/images';
import { colors } from '../theme';

// Owner: what customers see (logo, contact, notice), delivery rules, open/closed, bill caption
export default function SettingsScreen({ navigation }) {
  const { setShop } = useAuth();
  const { data, loading, error, reload } = useLoad(() => api.settings().then((r) => r.settings));
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data && !f) {
      setF({
        ...data,
        about: data.about || '', email: data.email || '', hours: data.hours || '', map_url: data.map_url || '',
        website: data.website || '', facebook: data.facebook || '', instagram: data.instagram || '',
        delivery_fee: String(data.delivery_fee || ''), free_delivery_over: String(data.free_delivery_over || ''), min_order: String(data.min_order || ''),
      });
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  if (loading || !f) return <Screen title="Shop settings">{error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />}</Screen>;

  const pickLogo = async () => {
    try {
      const img = await pickAndUpload({ square: true, maxWidth: 600, title: 'Logo' });
      if (img) setF((x) => ({ ...x, logo_id: img.id, logo_url: img.url }));
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add the logo', text2: e.message });
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const keys = ['phone', 'whatsapp', 'address', 'notice', 'delivery_fee', 'free_delivery_over', 'min_order', 'pickup', 'is_open', 'closed_message', 'order_prefix', 'bill_caption', 'logo_id',
        'about', 'email', 'hours', 'map_url', 'website', 'facebook', 'instagram'];
      const r = await api.saveSettings(Object.fromEntries(keys.map((k) => [k, typeof f[k] === 'boolean' ? (f[k] ? 1 : 0) : f[k]])));
      setShop(r.shop);
      Toast.show({ type: 'success', text1: r.message });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Shop settings" subtitle={f.name} footer={<Footer><Button testID="settings-save" title="Save settings" onPress={save} loading={busy} /></Footer>}>
      <Card style={{ backgroundColor: f.is_open ? colors.successSoft : colors.dangerSoft, borderColor: 'transparent' }}>
        <Toggle label={f.is_open ? 'Shop is open for orders' : 'Shop is closed'} value={f.is_open} onChange={set('is_open')}
          hint={f.is_open ? 'Turn off to stop new orders (e.g. at night)' : 'Customers can browse but not order'} />
        {!f.is_open && <Field label="Message to customers" value={f.closed_message} onChangeText={set('closed_message')} placeholder="We open at 9 am" style={{ marginTop: 8, marginBottom: 0 }} />}
      </Card>

      <SectionTitle>Logo</SectionTitle>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {f.logo_url ? <Image source={{ uri: f.logo_url }} style={{ width: 72, height: 72, borderRadius: 12 }} resizeMode="contain" />
          : <View style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={s.itemMeta}>No logo</Text></View>}
        <View style={{ flex: 1, gap: 8 }}>
          <Button small variant="ghost" icon="image-outline" title={f.logo_url ? 'Change logo' : 'Add logo'} onPress={pickLogo} />
          {!!f.logo_url && <Button small variant="outline" title="Remove" onPress={() => setF((x) => ({ ...x, logo_id: 0, logo_url: '' }))} />}
        </View>
      </Card>

      <SectionTitle>Contact</SectionTitle>
      <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Field label="WhatsApp number" value={f.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" hint="Leave empty to use the phone" />
      <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholder="shop@example.com" />
      <Field label="Shop address" value={f.address} onChangeText={set('address')} hint="Shown for pickup orders and on the About page" />
      <Field label="Google Maps link" value={f.map_url} onChangeText={set('map_url')} autoCapitalize="none" keyboardType="url"
        placeholder="https://maps.app.goo.gl/…" hint="Optional. Without it, the map searches for the address" />
      <Field label="Notice on home page" value={f.notice} onChangeText={set('notice')} placeholder="e.g. Fresh mangoes arrived!" />

      <SectionTitle>About page</SectionTitle>
      <Text style={[s.itemMeta, { marginBottom: 10 }]}>Customers open it from the ⓘ icon on the shop's home page. It also shows the contact details above.</Text>
      <Field label="About the shop" value={f.about} onChangeText={set('about')} multiline maxLength={3000} inputStyle={{ height: 120 }}
        placeholder="Who you are, what you sell, since when…" testID="set-about" />
      <Field label="Opening hours" value={f.hours} onChangeText={set('hours')} multiline maxLength={500} inputStyle={{ height: 80 }}
        placeholder={'Mon–Sat: 9 am – 10 pm\nSunday: 12 pm – 8 pm'} />
      <Field label="Website" value={f.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" placeholder="www.example.com" />
      <Field label="Facebook page" value={f.facebook} onChangeText={set('facebook')} autoCapitalize="none" keyboardType="url" placeholder="facebook.com/yourshop" />
      <Field label="Instagram" value={f.instagram} onChangeText={set('instagram')} autoCapitalize="none" keyboardType="url" placeholder="instagram.com/yourshop" />

      <SectionTitle>Delivery</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field style={{ flex: 1 }} label="Delivery charge" value={f.delivery_fee} onChangeText={set('delivery_fee')} keyboardType="decimal-pad" testID="set-fee" />
        <Field style={{ flex: 1 }} label="Free delivery over" value={f.free_delivery_over} onChangeText={set('free_delivery_over')} keyboardType="decimal-pad" hint="0 = never free" />
      </View>
      <Field label="Minimum order amount" value={f.min_order} onChangeText={set('min_order')} keyboardType="decimal-pad" hint="0 = no minimum" />
      <Card><Toggle label="Allow pickup from shop" value={f.pickup} onChange={set('pickup')} hint="No delivery charge for pickup" /></Card>

      <SectionTitle>Orders & bills</SectionTitle>
      <Field label="Order number prefix" value={f.order_prefix} onChangeText={(v) => set('order_prefix')(v.toUpperCase())} autoCapitalize="characters" maxLength={8} placeholder="e.g. MM-" hint="Orders are numbered MM-00001, MM-00002…" />
      <Field label="Bill caption" value={f.bill_caption} onChangeText={set('bill_caption')} multiline maxLength={300} placeholder="Thank you for shopping with us!" />
    </Screen>
  );
}

function Toggle({ label, value, onChange, hint }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', color: colors.text }}>{label}</Text>
        {!!hint && <Text style={s.itemMeta}>{hint}</Text>}
      </View>
      <Switch value={!!value} onValueChange={onChange} />
    </View>
  );
}
