import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, KV } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { money } from '../services/format';
import { colors } from '../theme';

export default function OrderPlacedScreen({ navigation, route }) {
  const { order, accountExists, newAccount } = route.params;
  const { isCustomer } = useAuth();
  const track = () => (isCustomer
    ? navigation.navigate('MyOrderDetail', { id: order.id })
    : navigation.navigate('MyOrderDetail', { id: order.id, key: order.access_key }));

  return (
    <Screen title="Order placed" back={false}>
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={52} color={colors.success} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.black, marginTop: 14 }}>Thank you!</Text>
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6 }}>
          Your order {order.order_no} has been sent to the shop.{'\n'}We'll notify you when it's confirmed.
        </Text>
      </View>
      <Card>
        <KV label="Order" value={order.order_no} />
        <KV label="Items" value={String(order.items.length)} />
        <KV label="Total (cash)" value={money(order.total)} bold />
      </Card>
      {newAccount && (
        <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
          <Text style={{ color: colors.primaryDark }}>
            We created your account with {order.email}. You're logged in on this phone. Set a password in My account to log in on other phones.
          </Text>
        </Card>
      )}
      {accountExists && (
        <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
          <Text style={{ color: colors.warning }}>You already have an account with these details. Log in to see all your orders in one place.</Text>
        </Card>
      )}
      <Button testID="track-order" title="Track my order" icon="navigate-outline" onPress={track} style={{ marginBottom: 10 }} />
      {accountExists && <Button title="Log in" variant="outline" onPress={() => navigation.navigate('Login')} style={{ marginBottom: 10 }} />}
      <Button title="Continue shopping" variant="ghost" onPress={() => navigation.navigate('Home')} />
    </Screen>
  );
}
