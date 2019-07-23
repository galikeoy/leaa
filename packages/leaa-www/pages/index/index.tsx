import React from 'react';
import Head from 'next/head';

import { ImageSwiper } from '@leaa/www/components/ImageSwiper';
import { useQuery } from '@apollo/react-hooks';
import { Ax } from '@leaa/common/entrys';
import { AxArgs } from '@leaa/common/dtos/ax';
import { GET_AX_BY_SLUG } from '@leaa/common/graphqls';
import { ErrorCard } from '../../components/ErrorCard/ErrorCard';

export default () => {
  const getAxBySlugVariables = { slug: 'index-swiper' };
  const getAxBySlugQuery = useQuery<{ axBySlug: Ax }, AxArgs>(GET_AX_BY_SLUG, {
    variables: getAxBySlugVariables,
  });

  const bannerMbList =
    (getAxBySlugQuery &&
      getAxBySlugQuery.data &&
      getAxBySlugQuery.data.axBySlug &&
      getAxBySlugQuery.data.axBySlug.attachments &&
      getAxBySlugQuery.data.axBySlug.attachments.bannerMbList) ||
    [];

  return (
    <>
      {getAxBySlugQuery.error ? <ErrorCard error={getAxBySlugQuery.error} /> : null}

      <Head>
        <title>Here Is Home</title>
      </Head>

      <ImageSwiper attachmentList={bannerMbList} />
    </>
  );
};
