import { makeStyles } from '@material-ui/core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LinkButton } from '../../../../components/LinkButton';
import { fetchAddressBookAction } from '../../../data/actions/tokens';
import type { ChainEntity } from '../../../data/entities/chain';
import type { TokenEntity } from '../../../data/entities/token';
import { isTokenErc20, isTokenNative } from '../../../data/entities/token';
import { selectChainById } from '../../../data/selectors/chains';
import {
  selectIsAddressBookLoaded,
  selectShouldInitAddressBook,
} from '../../../data/selectors/data-loader';
import { selectIsTokenLoaded, selectTokenById } from '../../../data/selectors/tokens';
import { styles } from './styles';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { AssetsImage } from '../../../../components/AssetsImage';
import { selectBridgeByIdIfKnown } from '../../../data/selectors/bridges';
import { BridgeTag, NativeTag } from '../BridgeTag';

const useStyles = makeStyles(styles);

function TokenCardDisplay({ token }: { token: TokenEntity }) {
  const classes = useStyles();
  const { t } = useTranslation();
  const chain = useAppSelector(state => selectChainById(state, token.chainId));
  const isErc20 = isTokenErc20(token);
  const isNative = isTokenNative(token) || (isErc20 && token.bridge === 'native');
  const bridge = useAppSelector(state =>
    isErc20 && token.bridge && !isNative ? selectBridgeByIdIfKnown(state, token.bridge) : undefined
  );

  return (
    <div className={classes.container}>
      <div className={classes.titleContainer}>
        <div className={classes.title}>
          <AssetsImage assetIds={[token.id]} chainId={chain.id} size={24} />
          <span>{token.symbol}</span>
          {isNative ? (
            <NativeTag chain={chain} />
          ) : bridge ? (
            <BridgeTag bridge={bridge} chain={chain} />
          ) : null}
        </div>
        <div className={classes.buttonsContainer}>
          {token.website && (
            <LinkButton hideIconOnMobile={true} href={token.website} text={t('Token-Site')} />
          )}
          {isErc20 && (
            <LinkButton
              hideIconOnMobile={true}
              href={`${chain.explorerUrl}/token/${token.address}`}
              text={t('Token-Contract')}
            />
          )}
          {token.documentation && (
            <LinkButton hideIconOnMobile={true} href={token.documentation} text={t('Token-Docs')} />
          )}
        </div>
      </div>
      <div className={classes.description}>
        {token.description ? token.description : t('Token-NoDescrip')}
      </div>
    </div>
  );
}

function TokenCardComponent({
  chainId,
  tokenId,
}: {
  chainId: ChainEntity['id'];
  tokenId: TokenEntity['id'];
}) {
  const tokenLoaded = useAppSelector(
    state =>
      (selectIsAddressBookLoaded(state, chainId) && selectIsTokenLoaded(state, chainId, tokenId)) ||
      false
  );
  const token = useAppSelector(state =>
    tokenLoaded ? selectTokenById(state, chainId, tokenId) : null
  );
  const shouldInitAddressBook = useAppSelector(state =>
    selectShouldInitAddressBook(state, chainId)
  );
  // initialize addressbook
  const dispatch = useAppDispatch();
  React.useEffect(() => {
    if (shouldInitAddressBook) {
      dispatch(fetchAddressBookAction({ chainId: chainId }));
    }
  }, [dispatch, chainId, shouldInitAddressBook]);

  // sometimes we have mooX tokens in the asset list
  // so we never know if a token will ever load or not
  // see: vault beets-sound-of-moosic
  if (!tokenLoaded || !token) {
    return <></>;
  }

  return <TokenCardDisplay token={token} />;
}

export const TokenCard = React.memo(TokenCardComponent);
