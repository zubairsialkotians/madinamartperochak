import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Card, KV, Field, Footer, Button, Segmented, SectionTitle, s } from '../components/ui';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/AuthContext';
import { api } from '../services/api';
import { money, qtyLabel } from '../services/format';
import { deliveryFee, round2 } from '../services/qty';
import { SHOP_KEY } from '../config';
import { colors } from '../theme';

export const GUEST_ORDERS_KEY = `guest_orders_${SHOP_KEY}`;

// Guests fill in their details; the server makes them an account (or links an existing one)
export default function CheckoutScreen({ navigation }) {
  const cart = useCart();
  const { shop, user, isCustomer, startSession } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email: user?.email || '', address: user?.address || '', note: '',
  });
  const [fulfilment, setFulfilment] = useState('delivery');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => { setForm({ ...form, [k]: v }); setErrors({ ...errors, [k]: '' }); };

  const fee = deliveryFee(shop, cart.subtotal, fulfilment);
  const total = round2(cart.subtotal + fee);

  const place = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (fulfilment === 'delivery' && !form.address.trim()) e.address = 'Enter your delivery address';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const r = await api.placeOrder({
        ...form, fulfilment,
        items: cart.lines.map((l) => ({ item_id: l.item_id, qty: l.qty })),
      });
      cart.clear();
      if (r.token) await startSession(r); // new account → logged in
      if (!r.token && !isCustomer) {
        // Guest using an existing account's details: keep a link to this order on the phone
        const raw = await AsyncStorage.getItem(GUEST_ORDERS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({ id: r.order.id, key: r.order.access_key, order_no: r.order.order_no });
        await AsyncStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
      }
      navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'OrderPlaced', params: { order: r.order, accountExists: !!r.account_exists, newAccount: !!r.token } }] });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not place the order', text2: err.message, visibilityTime: 7000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Checkout"
      footer={(
        <Footer>
          <Button testID="place-order" title={`Place order · ${money(total)}`} icon="checkmark-circle" loading={busy} onPress={place} />
        </Footer>
      )}
    >
      {shop?.pickup && (
        <Segmented value={fulfilment} onChange={setFulfilment}
          options={[{ value: 'delivery', label: 'Home delivery' }, { value: 'pickup', label: 'Pick up from shop' }]} />
      )}

      <SectionTitle>Your details</SectionTitle>
      <Field label="Full name" value={form.name} onChangeText={set('name')} error={errors.name} testID="co-name" />
      <Field label="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} testID="co-phone" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} testID="co-email" />
      <Field label={fulfilment === 'delivery' ? 'Delivery address' : 'Address (optional)'} value={form.address} onChangeText={set('address')}
        multiline error={errors.address} placeholder="House, street, area, city" testID="co-address" />
      <Field label="Note for the shop (optional)" value={form.note} onChangeText={set('note')} placeholder="e.g. call before coming" />
      {fulfilment === 'pickup' && !!shop?.address && <Text style={[s.itemMeta, { marginTop: -6, marginBottom: 12 }]}>Pick up from: {shop.address}</Text>}

      <SectionTitle>Order summary</SectionTitle>
      <Card>
        {cart.lines.map((l) => (
          <View key={l.item_id} style={{ flexDirection: 'row', paddingVertical: 4 }}>
            <Text style={{ flex: 1, color: colors.text }} numberOfLines={1}>{l.name} <Text style={{ color: colors.muted }}>× {qtyLabel(l.qty, l.unit)}</Text></Text>
            <Text style={{ fontWeight: '700', color: colors.text }}>{money(round2(l.qty * l.price))}</Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
        <KV label="Items" value={money(cart.subtotal)} />
        <KV label={fulfilment === 'pickup' ? 'Pickup' : 'Delivery'} value={fee ? money(fee) : 'Free'} tone={fee ? undefined : 'good'} />
        <KV label="Total to pay" value={money(total)} bold />
        <Text style={s.itemMeta}>Payment: cash {fulfilment === 'pickup' ? 'at pickup' : 'on delivery'}</Text>
      </Card>

      {!user && (
        <Text style={[s.itemMeta, { textAlign: 'center' }]}>
          We'll create an account with these details so you can track your order. Already have one?{' '}
          <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => navigation.navigate('Login')}>Log in</Text>
        </Text>
      )}
    </Screen>
  );
}
