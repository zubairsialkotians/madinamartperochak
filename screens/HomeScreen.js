import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { IconBadge } from '../components/shop';
import { Catalogue } from '../components/Catalogue';
import { MenuStrip, runSync } from '../components/MenuSync';
import { CartPanel, SizePicker, isSplit, panelWidth } from '../components/CartPanel';
import BannerSlider from '../components/BannerSlider';
import { useLoad } from '../components/useData';
import { useAuth } from '../components/AuthContext';
import { useCart } from '../components/CartContext';
import { api } from '../services/api';
import { money } from '../services/format';
import { getNewsSeen } from '../services/newsSeen';
import { colors } from '../theme';

// Storefront: categories + product grid (also what staff see under "View shop")
export default function HomeScreen({ navigation }) {
  const { shop, user, isStaff, isTeam, isCashier, isSeller, reloadShop } = useAuth();
  const cart = useCart();
  const { width } = useWindowDimensions();
  const [newsSeen, setNewsSeen] = useState(null);
  const [sizesOf, setSizesOf] = useState(null);
  useFocusEffect(useCallback(() => { getNewsSeen().then(setNewsSeen); }, []));
  const hasNews = newsSeen !== null && (shop?.latest_news_id || 0) > newsSeen;

  const banners = useLoad(() => api.banners().then((r) => r.banners).catch(() => []));

  // Tablet + taking orders (owner, branch admin, cashier): the order shows on the right while items are added on the left
  const split = isSplit(width, isSeller);
  const sideW = split ? panelWidth(width) : 0;

  const header = ({ showCategory, contentWidth }) => (
    <View>
      {isSeller && <MenuStrip onSetup={runSync} />}
      {isSeller && !split && (
        <TouchableOpacity style={[st.banner, { backgroundColor: colors.primarySoft }]} onPress={() => navigation.navigate('Cart')} testID="pos-banner">
          <Ionicons name="receipt-outline" size={18} color={colors.primaryDark} />
          <Text style={st.bannerText}>
            Taking an order: add items like a customer, then open the cart to enter the customer, discount and place it (confirmed at once).
          </Text>
        </TouchableOpacity>
      )}
      {!shop?.is_open && !isSeller && (
        <View style={[st.banner, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="time-outline" size={18} color={colors.danger} />
          <Text style={[st.bannerText, { color: colors.danger }]}>{shop?.closed_message || 'We are closed right now and not taking orders.'}</Text>
        </View>
      )}
      {!!shop?.notice && (
        <View style={st.banner}>
          <Ionicons name="megaphone-outline" size={18} color={colors.primaryDark} />
          <Text style={st.bannerText}>{shop.notice}</Text>
        </View>
      )}
      {shop?.free_delivery_over > 0 && (
        <View style={[st.banner, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="bicycle-outline" size={18} color={colors.success} />
          <Text style={[st.bannerText, { color: colors.success }]}>Free delivery on orders over {money(shop.free_delivery_over)}</Text>
        </View>
      )}
      <BannerSlider banners={banners.data || []} width={contentWidth}
        onPress={(b) => { if (b.category_id) showCategory(b.category_id); }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={st.top}>
        <Image source={shop?.logo_url ? { uri: shop.logo_url } : require('../assets/icon.png')} style={st.logo} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={st.shopName} numberOfLines={1}>{shop?.name}</Text>
          <Text style={st.hello} numberOfLines={1}>{user ? `Hi, ${user.name?.split(' ')[0] || ''}` : 'Order online, pay on delivery'}</Text>
        </View>
        {isStaff && <IconBadge icon="speedometer-outline" onPress={() => navigation.navigate('AdminHome')} />}
        {isCashier && <IconBadge icon="receipt-outline" onPress={() => navigation.navigate('AdminOrders')} />}
        {isTeam && <IconBadge icon="clipboard-outline" onPress={() => navigation.navigate('TeamHome')} />}
        <IconBadge icon="information-circle-outline" onPress={() => navigation.navigate('Contact')} testID="open-contact" />
        <IconBadge icon="megaphone-outline" dot={hasNews} onPress={() => navigation.navigate('News')} testID="open-news" />
        {!split && <IconBadge icon="cart-outline" count={cart.count} onPress={() => navigation.navigate('Cart')} testID="open-cart" />}
        <IconBadge icon="person-circle-outline" onPress={() => navigation.navigate('Account')} testID="open-account" />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Catalogue
          width={width - sideW}
          header={header}
          catStyle={{ wrap: st.catImgWrap, img: st.catImg, text: st.catText }}
          bottomPadding={cart.count || split ? 90 : 30}
          onSizes={split ? setSizesOf : undefined}
          onProductPress={(item) => navigation.navigate('Product', { id: item.id, product: item })}
          onRefresh={() => { banners.reload(); reloadShop(); }}
        />
        {split && <CartPanel width={sideW} onCheckout={() => navigation.navigate('PosOrder')} />}
      </View>
      {split && <SizePicker product={sizesOf} onClose={() => setSizesOf(null)} />}

      {cart.count > 0 && !split && (
        <TouchableOpacity style={st.cartBar} onPress={() => navigation.navigate('Cart')} testID="cart-bar">
          <View style={st.cartCount}><Text style={{ color: colors.primary, fontWeight: '800' }}>{cart.count}</Text></View>
          <Text style={st.cartBarText}>View cart</Text>
          <Text style={st.cartBarText}>{money(cart.subtotal)}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logo: { width: 40, height: 40, borderRadius: 8 },
  shopName: { fontSize: 19, fontWeight: '800', color: colors.primaryDark },
  hello: { fontSize: 12, color: colors.muted },
  banner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, padding: 10, marginBottom: 10 },
  bannerText: { flex: 1, color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
  cat: { width: 72, alignItems: 'center' },
  catImgWrap: { borderRadius: 34, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  catImg: { width: 58, height: 58, borderRadius: 29 },
  catText: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 },
  cartBar: {
    position: 'absolute', left: 14, right: 14, bottom: 18, height: 56, borderRadius: 16, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  cartCount: { backgroundColor: '#fff', borderRadius: 12, minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cartBarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
