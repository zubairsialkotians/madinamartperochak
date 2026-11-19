import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Screen, Footer, Button, Chip, Loading, ErrorBox, HeaderButton } from '../components/ui';
import { ProductImage, QtyStepper } from '../components/shop';
import { useLoad } from '../components/useData';
import { useCart } from '../components/CartContext';
import { api } from '../services/api';
import { money, perUnit, qtyLabel } from '../services/format';
import { minOf, round2 } from '../services/qty';
import { colors } from '../theme';

export default function ProductScreen({ navigation, route }) {
  const cart = useCart();
  const { width } = useWindowDimensions();
  const { data: p, loading, error, reload } = useLoad(() => api.product(route.params.id).then((r) => r.product), [route.params.id]);
  const shown = p || route.params.product;
  const inCart = cart.qtyOf(route.params.id);
  const [qty, setQty] = useState(0);
  const [img, setImg] = useState(0);

  // Start from what's in the cart, else the first preset / minimum
  useEffect(() => {
    if (!shown || qty) return;
    setQty(inCart || (shown.qty_options?.length ? shown.qty_options[0] : minOf(shown)));
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return <Screen title="Product">{loading ? <Loading /> : <ErrorBox message={error} onRetry={reload} />}</Screen>;

  const images = shown.images?.length ? shown.images : [{ url: shown.image }];
  const off = shown.compare_price > shown.price ? Math.round((1 - shown.price / shown.compare_price) * 100) : 0;
  const overMax = shown.max_qty != null && qty > shown.max_qty + 1e-9;
  const imgW = Math.min(width, 700);

  const save = () => {
    cart.setQty(shown.id, qty, shown);
    Toast.show({ type: 'success', text1: inCart ? 'Cart updated' : 'Added to cart', text2: `${qtyLabel(qty, shown.unit)} ${shown.name}` });
    navigation.goBack();
  };

  return (
    <Screen
      title={shown.name}
      subtitle={shown.category_name}
      padded={false}
      right={<HeaderButton icon="cart-outline" badge={cart.count} onPress={() => navigation.navigate('Cart')} />}
      footer={shown.in_stock ? (
        <Footer>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{qtyLabel(qty, shown.unit)}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.black }}>{money(round2(qty * shown.price))}</Text>
            </View>
            <Button testID="add-to-cart" title={inCart ? 'Update cart' : 'Add to cart'} icon="cart" onPress={save} disabled={!qty || overMax} style={{ flex: 1.4 }} />
          </View>
        </Footer>
      ) : null}
    >
      <View style={{ alignItems: 'center', backgroundColor: '#fff' }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: imgW }}
          onMomentumScrollEnd={(e) => setImg(Math.round(e.nativeEvent.contentOffset.x / imgW))}>
          {images.map((im, i) => <ProductImage key={i} uri={im.url} style={{ width: imgW, height: Math.min(imgW, 420) }} iconSize={60} />)}
        </ScrollView>
        {images.length > 1 && (
          <View style={st.dots}>{images.map((_, i) => <View key={i} style={[st.dot, i === img && { backgroundColor: colors.primary, width: 18 }]} />)}</View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={st.name}>{shown.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <Text style={st.price}>{perUnit(shown.price, shown.unit)}</Text>
          {off > 0 && <Text style={st.strike}>{money(shown.compare_price)}</Text>}
          {off > 0 && <Text style={st.off}>{off}% OFF</Text>}
        </View>

        {!shown.in_stock ? (
          <View style={st.outBox}><Text style={{ color: colors.danger, fontWeight: '700' }}>Out of stock — check again soon.</Text></View>
        ) : (
          <>
            <Text style={st.label}>How much?</Text>
            {shown.qty_options?.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {shown.qty_options.map((o) => (
                  <Chip key={o} label={qtyLabel(o, shown.unit)} active={Math.abs(qty - o) < 1e-9} onPress={() => setQty(o)} />
                ))}
              </View>
            )}
            <View style={{ maxWidth: 260 }}>
              <QtyStepper product={shown} qty={qty} onChange={(q) => setQty(q || minOf(shown))} testID="qty" />
            </View>
            {overMax && <Text style={{ color: colors.danger, marginTop: 6 }}>Only {qtyLabel(shown.max_qty, shown.unit)} available.</Text>}
            {shown.min_qty > shown.qty_step && <Text style={st.hint}>Minimum {qtyLabel(shown.min_qty, shown.unit)}</Text>}
          </>
        )}

        {!!shown.description && (
          <>
            <Text style={[st.label, { marginTop: 18 }]}>About this product</Text>
            <Text style={{ color: colors.text, lineHeight: 21 }}>{shown.description}</Text>
          </>
        )}
        {loading && !p && <Loading />}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  name: { fontSize: 21, fontWeight: '800', color: colors.black },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary },
  strike: { fontSize: 14, color: colors.faint, textDecorationLine: 'line-through' },
  off: { fontSize: 12, fontWeight: '800', color: colors.sale },
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 6 },
  outBox: { backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12, marginTop: 14 },
});
